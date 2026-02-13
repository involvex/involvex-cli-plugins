const { spawn } = require("child_process");
const blessed = require("blessed");

class ProcessManagerPlugin {
  constructor() {
    this.name = "Process Manager";
    this.description = "View running processes and memory usage";
    this.version = "1.0.0";
    this.author = "InvolveX";
    this.refreshTimer = null;
  }

  async initializeAsync() {
    // No initialization required
  }

  async shutdownAsync() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async getProcessList() {
    return new Promise(resolve => {
      if (process.platform !== "win32") {
        resolve([]);
        return;
      }

      const tasklist = spawn("tasklist", ["/fo", "csv", "/nh"], {
        shell: true,
      });
      let stdout = "";

      tasklist.stdout.on("data", data => {
        stdout += data.toString();
      });

      tasklist.on("close", code => {
        if (code !== 0 || !stdout) {
          resolve([]);
          return;
        }

        const lines = stdout.trim().split(/\r?\n/).filter(Boolean);

        const processes = lines.map(line => {
          const parts = line
            .split('","')
            .map(part => part.replace(/^"|"$/g, "").trim());

          const [imageName, pid, sessionName, sessionNum, memUsage] = parts;
          const memoryValue =
            parseInt(memUsage.replace(/[^0-9]/g, ""), 10) || 0;

          return {
            name: imageName,
            pid,
            session: sessionName,
            sessionNum,
            memory: memoryValue,
          };
        });

        processes.sort((a, b) => b.memory - a.memory);
        resolve(processes.slice(0, 30));
      });

      tasklist.on("error", () => {
        resolve([]);
      });
    });
  }

  async execute(screen) {
    const processBox = blessed.box({
      top: "center",
      left: "center",
      width: "80%",
      height: "80%",
      border: {
        type: "line",
      },
      label: " {green-fg}Process Manager{/green-fg} ",
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

    const updateDisplay = async () => {
      try {
        const processes = await this.getProcessList();
        if (processes.length === 0) {
          processBox.setContent(
            "Unable to retrieve process information. Ensure tasklist is available.",
          );
          screen.render();
          return;
        }

        let content = "{green-fg}Top Processes by Memory Usage{/green-fg}\n";
        content += "Name (PID)           Session       Memory\n";
        content += "---------------------------------------------\n";

        processes.forEach(proc => {
          const memText = `${Math.round((proc.memory / 1024) * 100) / 100} MB`;
          content += `${proc.name.slice(0, 22).padEnd(22)} (${proc.pid.padStart(5)})  ${proc.session
            .slice(0, 10)
            .padEnd(10)}  ${memText}\n`;
        });

        content +=
          "\n{green-fg}Press R to refresh | Press Q or ESC to close{/green-fg}";
        processBox.setContent(content);
        screen.render();
      } catch (error) {
        processBox.setContent(`Error retrieving processes: ${error.message}`);
        screen.render();
      }
    };

    screen.append(processBox);
    processBox.focus();
    await updateDisplay();

    processBox.key(["r", "R"], async () => {
      await updateDisplay();
    });

    processBox.key(["escape", "q", "C-c"], async () => {
      await this.shutdownAsync();
      processBox.destroy();
      screen.render();
    });
  }
}

module.exports = ProcessManagerPlugin;
