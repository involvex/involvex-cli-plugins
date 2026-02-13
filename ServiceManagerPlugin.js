const { spawn } = require("child_process");
const blessed = require("blessed");

class ServiceManagerPlugin {
  constructor() {
    this.name = "Service Manager";
    this.description = "View Windows services and their status";
    this.version = "1.0.0";
    this.author = "InvolveX";
  }

  async initializeAsync() {
    // Nothing to initialize
  }

  async shutdownAsync() {
    // Nothing to dispose
  }

  async getServiceList() {
    return new Promise(resolve => {
      if (process.platform !== "win32") {
        resolve([]);
        return;
      }

      const psScript = `
        try {
          Get-Service |
            Select-Object -First 100 Name, DisplayName, Status |
            ConvertTo-Json -Depth 2
        } catch {
          Write-Output "[]"
        }
      `;

      const child = spawn("powershell", ["-Command", psScript], {
        shell: true,
      });
      let stdout = "";

      child.stdout.on("data", data => {
        stdout += data.toString();
      });

      child.on("close", () => {
        try {
          const services = JSON.parse(stdout || "[]");
          const normalized = Array.isArray(services) ? services : [services];
          resolve(
            normalized.map(service => ({
              name: service.Name || "Unknown",
              displayName: service.DisplayName || service.Name || "Unknown",
              status: service.Status || "Unknown",
            })),
          );
        } catch {
          resolve([]);
        }
      });

      child.on("error", () => {
        resolve([]);
      });
    });
  }

  async execute(screen) {
    const servicesBox = blessed.box({
      top: "center",
      left: "center",
      width: "80%",
      height: "80%",
      border: {
        type: "line",
      },
      label: " {green-fg}Service Manager{/green-fg} ",
      style: {
        bg: "black",
        fg: "green",
        border: {
          fg: "green",
        },
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      mouse: true,
    });

    screen.append(servicesBox);
    servicesBox.focus();

    const renderServices = async () => {
      const services = await this.getServiceList();
      if (!services.length) {
        servicesBox.setContent("Unable to retrieve service information.");
        screen.render();
        return;
      }

      let content = "{green-fg}Windows Services (Top 100){/green-fg}\n";
      content += "Name                    Status      Display Name\n";
      content += "------------------------------------------------------\n";

      services.forEach(service => {
        content += `${service.name.slice(0, 23).padEnd(23)}  ${service.status
          .slice(0, 10)
          .padEnd(10)}  ${service.displayName.slice(0, 40)}\n`;
      });

      content +=
        "\n{green-fg}Press R to refresh | Press Q or ESC to close{/green-fg}";
      servicesBox.setContent(content);
      screen.render();
    };

    await renderServices();

    servicesBox.key(["r", "R"], async () => {
      await renderServices();
    });

    servicesBox.key(["escape", "q", "C-c"], () => {
      servicesBox.destroy();
      screen.render();
    });
  }
}

module.exports = ServiceManagerPlugin;
