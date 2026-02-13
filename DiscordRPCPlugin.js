// Discord RPC - using discord-rpc package
let discordRPC = null;
try {
  discordRPC = require("discord-rpc");
} catch {
  // Package not installed, will handle gracefully
}

const blessed = require("blessed"); // Add this line

class DiscordRPCPlugin {
  constructor() {
    this.name = "DiscordRPC";
    this.description =
      "Discord Rich Presence integration with funny status messages";
    this.version = "1.0.0";
    this.author = "InvolveX";
    this.client = null;
    this.isConnected = false;
    this.updateInterval = null;
    this.clientId = "1438575785228242994"; // Default InvolveX CLI Discord application ID
  }

  async initializeAsync() {
    // Plugin initialization
  }

  async shutdownAsync() {
    await this.disconnect();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  async connect(clientId) {
    if (this.isConnected) {
      return true;
    }

    if (!discordRPC) {
      console.error(
        "Discord RPC package not installed. Run: npm install discord-rpc",
      );
      return false;
    }

    try {
      this.clientId = clientId || this.clientId;
      const RPC = discordRPC.Client;
      this.client = new RPC({ transport: "ipc" });

      this.client.on("ready", () => {
        this.isConnected = true;
        console.log("Discord RPC connected!");
      });

      await this.client.login({ clientId: this.clientId });
      return true;
    } catch (error) {
      console.error("Discord RPC connection failed:", error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.destroy();
        this.isConnected = false;
        console.log("Discord RPC disconnected");
      } catch (error) {
        console.error("Error disconnecting Discord RPC:", error.message);
      }
    }
  }

  generateRandomDescription() {
    const descriptions = [
      `Generated ${Math.floor(Math.random() * 1000) + 1} cups of coffee ☕`,
      `Cleared ${Math.floor(Math.random() * 50) + 1} GB of cache 🗑️`,
      `Updated ${Math.floor(Math.random() * 20) + 1} packages 📦`,
      `Fixed ${Math.floor(Math.random() * 10) + 1} system issues 🔧`,
      `Optimized ${Math.floor(Math.random() * 5) + 1} drivers 🚀`,
      `Pinged ${Math.floor(Math.random() * 100) + 1} servers 🌐`,
      `Deleted ${Math.floor(Math.random() * 200) + 1} temp files 🧹`,
      `Monitored ${Math.floor(Math.random() * 10) + 1} system processes 📊`,
      `Configured ${Math.floor(Math.random() * 15) + 1} DNS servers 🔒`,
      `Restored ${Math.floor(Math.random() * 3) + 1} system points 💾`,
      `Uninstalled ${Math.floor(Math.random() * 5) + 1} programs 🗑️`,
      `Cleared ${Math.floor(Math.random() * 8) + 1} GB of RAM 🧠`,
      `Updated ${Math.floor(Math.random() * 30) + 1} Python packages 🐍`,
      `Scanned ${Math.floor(Math.random() * 50) + 1} startup programs 🔍`,
      `Optimized ${Math.floor(Math.random() * 12) + 1} network settings 📡`,
      `Hacked the mainframe ${Math.floor(Math.random() * 100) + 1} times 💻`,
      `Compiled ${Math.floor(Math.random() * 25) + 1} lines of code 💻`,
      `Defragmented ${Math.floor(Math.random() * 3) + 1} drives 💿`,
      `Backed up ${Math.floor(Math.random() * 10) + 1} configurations 💾`,
      `Analyzed ${Math.floor(Math.random() * 100) + 1} system logs 📋`,
      `Generated ${Math.floor(Math.random() * 500) + 1} memes 🎭`,
      `Fixed ${Math.floor(Math.random() * 20) + 1} registry entries 🔑`,
      `Optimized ${Math.floor(Math.random() * 7) + 1} services ⚙️`,
      `Scanned ${Math.floor(Math.random() * 1000) + 1} files for viruses 🛡️`,
      `Created ${Math.floor(Math.random() * 5) + 1} restore points 🎯`,
      `Updated ${Math.floor(Math.random() * 15) + 1} Windows updates 🪟`,
      `Cleared ${Math.floor(Math.random() * 200) + 1} browser caches 🌐`,
      `Optimized ${Math.floor(Math.random() * 10) + 1} startup times ⚡`,
      `Monitored ${Math.floor(Math.random() * 20) + 1} CPU cores 🔥`,
      `Backed up ${Math.floor(Math.random() * 50) + 1} GB of data 💿`,
    ];

    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  async updatePresence() {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const description = this.generateRandomDescription();
      await this.client.setActivity({
        details: "Using InvolveX CLI",
        state: description,
        largeImageKey: "involvex_logo",
        largeImageText: "InvolveX CLI - Windows System Administration Toolkit",
        smallImageKey: "terminal",
        smallImageText: "Terminal Mode",
        startTimestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error updating Discord presence:", error.message);
    }
  }

  async start(clientId, updateIntervalMs = 15000) {
    const connected = await this.connect(clientId);
    if (!connected) {
      return false;
    }

    // Initial update
    await this.updatePresence();

    // Update every 15 seconds with new random description
    this.updateInterval = setInterval(() => {
      this.updatePresence();
    }, updateIntervalMs);

    return true;
  }

  async stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    await this.disconnect();
  }

  // Method to be called by the CLI
  async execute(screen) {
    // Execution handled through settings; nothing to render directly
    // Instead, show a message to the user
    const messageDialog = blessed.box({
      top: "center",
      left: "center",
      width: "50%",
      height: "20%",
      border: {
        type: "line",
      },
      label: " {green-fg}Discord RPC{/green-fg} ",
      content:
        "\nDiscord Rich Presence is managed via the Settings menu.\n\nPress any key to continue...",
      style: {
        bg: "black",
        fg: "green",
        border: {
          fg: "green",
        },
      },
      keys: true,
    });

    screen.append(messageDialog);
    screen.render();

    return new Promise(resolve => {
      messageDialog.key(["enter", "escape", "q", "space"], () => {
        messageDialog.destroy();
        screen.render();
        resolve(true);
      });
      messageDialog.focus();
    });
  }
}

module.exports = DiscordRPCPlugin;
