// Speed Test Plugin for InvolveX CLI
// Tests internet connection speed and ping

const SpeedTestService =
  require("../../dist/services/SpeedTestService.js").default;
const chalk = require("chalk");

class SpeedTestPlugin {
  constructor(services) {
    this.name = "Speed Test Plugin";
    this.version = "1.0.0";
    this.description = "Test your internet connection speed";
    this.author = "InvolveX Team";
    this.speedTestService = new SpeedTestService(services.log);
  }

  getMenuItems() {
    return [
      {
        name: "Network Speed Test",
        description: "Test your internet connection speed and ping",
        handler: async () => this.runSpeedTest(),
      },
    ];
  }

  async runSpeedTest() {
    try {
      console.clear();
      console.log(chalk.cyan("\n🌐 Running internet speed test...\n"));
      console.log(chalk.yellow("This may take 1-2 minutes. Please wait...\n"));

      const result = await this.speedTestService.runSpeedTest();

      console.log(chalk.green(this.speedTestService.formatResult(result)));

      // Show download/upload in MBps (bytes per second)
      console.log(chalk.gray("\nAlternate units (MBps):"));
      const downloadMBps = Math.round((result.download / 8) * 100) / 100;
      const uploadMBps = Math.round((result.upload / 8) * 100) / 100;
      console.log(
        chalk.white(
          `  Download: ${downloadMBps} MBps | Upload: ${uploadMBps} MBps`,
        ),
      );

      console.log(chalk.gray("\nTimestamp: ") + chalk.white(result.timestamp));
      console.log(
        chalk.gray("Server: ") + chalk.white(result.server?.name || "Unknown"),
      );
      console.log(
        chalk.gray("Location: ") +
          chalk.white(result.server?.country || "Unknown"),
      );

      await this.pressEnterToContinue();
    } catch (error) {
      console.error(
        chalk.red(
          `\n✗ Speed test failed: ${error instanceof Error ? error.message : String(error)}\n`,
        ),
      );
      await this.pressEnterToContinue();
    }
  }

  pressEnterToContinue() {
    return new Promise(resolve => {
      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(chalk.gray("Press Enter to continue..."), () => {
        rl.close();
        resolve();
      });
    });
  }
}

module.exports = SpeedTestPlugin;
