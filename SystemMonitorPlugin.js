const { spawn } = require("child_process");
const blessed = require("blessed");
const os = require("os");

class SystemMonitorPlugin {
  constructor() {
    this.name = "SystemMonitor";
    this.description =
      "Real-time system monitoring (CPU, GPU, Memory, Drive usage)";
    this.version = "1.0.0";
    this.author = "InvolveX";
    this.updateInterval = null;
    this.isRunning = false;
  }

  async initializeAsync() {
    // Plugin initialization
  }

  async shutdownAsync() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.isRunning = false;
  }

  async getCpuUsage() {
    return new Promise(resolve => {
      const cpus = os.cpus();
      const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const totalTick = cpus.reduce(
        (acc, cpu) =>
          acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0),
        0,
      );

      setTimeout(() => {
        const cpus2 = os.cpus();
        const totalIdle2 = cpus2.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalTick2 = cpus2.reduce(
          (acc, cpu) =>
            acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0),
          0,
        );

        const idle = totalIdle2 - totalIdle;
        const total = totalTick2 - totalTick;
        const usage = 100 - (100 * idle) / total;
        resolve(Math.round(usage * 100) / 100);
      }, 1000);
    });
  }

  async getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = (used / total) * 100;

    return {
      total: this.formatBytes(total),
      used: this.formatBytes(used),
      free: this.formatBytes(free),
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  async getDriveUsage() {
    return new Promise(resolve => {
      if (process.platform !== "win32") {
        resolve([]);
        return;
      }

      const psScript = `
        Get-PSDrive -PSProvider FileSystem | ForEach-Object {
          $drive = $_.Root
          $driveInfo = Get-Volume -DriveLetter $drive[0]
          if ($driveInfo) {
            $used = $driveInfo.SizeRemaining
            $total = $driveInfo.Size
            $usedBytes = $total - $used
            $percent = [math]::Round(($usedBytes / $total) * 100, 2)
            Write-Output "$($drive[0]):|$total|$usedBytes|$percent"
          }
        }
      `;

      const process = spawn("powershell", ["-Command", psScript], {
        shell: true,
      });

      let stdout = "";
      process.stdout.on("data", data => {
        stdout += data.toString();
      });

      process.on("close", () => {
        const lines = stdout
          .trim()
          .split("\n")
          .filter(line => line.trim());
        const result = lines.map(line => {
          const [drive, total, used, percent] = line.split("|");
          return {
            drive: drive || "Unknown",
            total: this.formatBytes(parseInt(total) || 0),
            used: this.formatBytes(parseInt(used) || 0),
            free: this.formatBytes(
              (parseInt(total) || 0) - (parseInt(used) || 0),
            ),
            percentage: parseFloat(percent) || 0,
          };
        });
        resolve(result);
      });

      process.on("error", () => {
        resolve([]);
      });
    });
  }

  async getGpuUsage() {
    return new Promise(resolve => {
      if (process.platform !== "win32") {
        resolve({ usage: 0, memory: { used: "0 MB", total: "0 MB" } });
        return;
      }

      const psScript = `
        try {
          $gpu = Get-CimInstance -ClassName Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1
          if ($gpu) {
            $adapterRAM = [math]::Round($gpu.AdapterRAM / 1MB, 2)
            Write-Output "GPU|$($gpu.Name)|$adapterRAM"
          } else {
            Write-Output "GPU|Unknown|0"
          }
        } catch {
          Write-Output "GPU|Unknown|0"
        }
      `;

      const process = spawn("powershell", ["-Command", psScript], {
        shell: true,
      });

      let stdout = "";
      process.stdout.on("data", data => {
        stdout += data.toString();
      });

      process.on("close", () => {
        const line = stdout.trim();
        if (line && line.includes("|")) {
          const [, name, memory] = line.split("|");
          resolve({
            name: name || "Unknown",
            memory: {
              total: `${parseFloat(memory) || 0} MB`,
              used: "N/A",
            },
            usage: 0, // GPU usage requires additional tools
          });
        } else {
          resolve({
            name: "Unknown",
            memory: { total: "0 MB", used: "N/A" },
            usage: 0,
          });
        }
      });

      process.on("error", () => {
        resolve({
          name: "Unknown",
          memory: { total: "0 MB", used: "N/A" },
          usage: 0,
        });
      });
    });
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  async getSystemInfo() {
    const [cpuUsage, memoryUsage, driveUsage, gpuInfo] = await Promise.all([
      this.getCpuUsage(),
      this.getMemoryUsage(),
      this.getDriveUsage(),
      this.getGpuUsage(),
    ]);

    return {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || "Unknown",
      },
      memory: memoryUsage,
      drives: driveUsage,
      gpu: gpuInfo,
      uptime: this.formatUptime(os.uptime()),
      platform: os.platform(),
      hostname: os.hostname(),
    };
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  // Method to be called by the CLI to display the monitor
  async displayMonitor(screen) {
    this.isRunning = true;
    const monitorBox = blessed.box({
      top: "center",
      left: "center",
      width: "80%",
      height: "80%",
      border: {
        type: "line",
      },
      label: " System Monitor ",
      style: {
        border: {
          fg: "green",
        },
        fg: "green",
      },
      scrollable: true,
      alwaysScroll: true,
    });

    screen.append(monitorBox);
    screen.render();

    const updateDisplay = async () => {
      if (!this.isRunning) return;

      try {
        const info = await this.getSystemInfo();
        let content = "";

        // CPU Info
        content += `{green-fg}CPU:{/green-fg}\n`;
        content += `  Model: ${info.cpu.model}\n`;
        content += `  Cores: ${info.cpu.cores}\n`;
        content += `  Usage: ${this.getProgressBar(info.cpu.usage, 100)} ${info.cpu.usage}%\n\n`;

        // Memory Info
        content += `{green-fg}Memory (RAM):{/green-fg}\n`;
        content += `  Total: ${info.memory.total}\n`;
        content += `  Used: ${info.memory.used}\n`;
        content += `  Free: ${info.memory.free}\n`;
        content += `  Usage: ${this.getProgressBar(info.memory.percentage, 100)} ${info.memory.percentage}%\n\n`;

        // GPU Info
        content += `{green-fg}GPU:{/green-fg}\n`;
        content += `  Name: ${info.gpu.name}\n`;
        content += `  Memory: ${info.gpu.memory.total}\n\n`;

        // Drive Info
        content += `{green-fg}Drive Usage:{/green-fg}\n`;
        if (info.drives.length > 0) {
          info.drives.forEach(drive => {
            content += `  ${drive.drive}:\n`;
            content += `    Total: ${drive.total}\n`;
            content += `    Used: ${drive.used}\n`;
            content += `    Free: ${drive.free}\n`;
            content += `    Usage: ${this.getProgressBar(drive.percentage, 100)} ${drive.percentage}%\n`;
          });
        } else {
          content += "  No drive information available\n";
        }

        content += `\n{green-fg}System Info:{/green-fg}\n`;
        content += `  Platform: ${info.platform}\n`;
        content += `  Hostname: ${info.hostname}\n`;
        content += `  Uptime: ${info.uptime}\n`;

        monitorBox.setContent(content);
        screen.render();
      } catch (error) {
        monitorBox.setContent(`Error: ${error.message}`);
        screen.render();
      }
    };

    // Initial update
    await updateDisplay();

    // Update every 2 seconds
    this.updateInterval = setInterval(updateDisplay, 2000);

    // Handle exit
    monitorBox.key(["escape", "q"], () => {
      this.isRunning = false;
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      monitorBox.destroy();
      screen.render();
    });

    monitorBox.focus();
  }

  getProgressBar(value, max, length = 20) {
    const filled = Math.round((value / max) * length);
    const empty = length - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    let color = "green";
    if (value > 80) color = "red";
    else if (value > 60) color = "yellow";
    return `{${color}-fg}${bar}{/${color}-fg}`;
  }
  async execute(screen) {
    await this.displayMonitor(screen);
  }
}

module.exports = SystemMonitorPlugin;
