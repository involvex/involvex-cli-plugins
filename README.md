# Plugins Directory

This directory contains InvolveX CLI plugins that extend functionality.

## Plugin System

The InvolveX CLI uses a modular plugin architecture allowing users to:

- Install plugins from the official repository
- Create custom plugins
- Share plugins via GitHub
- Manage plugins with CLI commands

## Local Plugins

Plugins in this directory are automatically loaded when the CLI starts.

### Structure

Each plugin is a directory containing:

```
plugin-name/
├── index.js          # Main plugin file
├── manifest.json     # Plugin metadata
└── package.json      # Optional dependencies
```

## Built-in Plugins

### DiscordRPCPlugin.js

- **Purpose**: Display InvolveX CLI status in Discord
- **Features**: Rich presence integration, status messages

### ProcessManagerPlugin.js

- **Purpose**: Advanced process management
- **Features**: Process listing, termination, restart

### ServiceManagerPlugin.js

- **Purpose**: Windows service management
- **Features**: Service control, status monitoring

### SystemMonitorPlugin.js

- **Purpose**: Real-time system monitoring
- **Features**: CPU/Memory/Disk monitoring, alerts

## Managing Plugins

### List Installed Plugins

```bash
involvex-cli --plugins list
```

### Install a Plugin

From the official repository:

```bash
involvex-cli --plugins install discord-rpc
```

From a custom GitHub repository:

```bash
involvex-cli --plugins install https://raw.githubusercontent.com/user/repo/main/plugins/plugin-name/index.js
```

### Update Plugins

Update all installed plugins:

```bash
involvex-cli --plugins update
```

Update a specific plugin:

```bash
involvex-cli --plugins update plugin-name
```

### Remove a Plugin

```bash
involvex-cli --plugins remove plugin-name
```

## Creating Your Own Plugin

See [`PLUGIN_DEVELOPMENT.md`](../PLUGIN_DEVELOPMENT.md) in the root directory for detailed plugin creation guide.

### Quick Start

1. Create a directory: `plugins/my-plugin/`
2. Create `index.js`:

```javascript
class MyPlugin {
  constructor(services) {
    this.services = services;
    this.name = "My Plugin";
    this.version = "1.0.0";
    this.author = "Your Name";
  }

  getMenuItems() {
    return [
      {
        name: "My Feature",
        description: "Do something",
        handler: async () => {
          /* ... */
        },
      },
    ];
  }
}

module.exports = MyPlugin;
```

3. Create `manifest.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My plugin",
  "author": "Your Name",
  "entry": "index.js"
}
```

## Remote Plugin Repository

The official plugin repository is available at:

- **Repository**: https://github.com/involvex/involvex-plugins
- **Submodule**: Integrated as `@plugins/` in this project

### Repository Structure

```
@plugins/
├── plugins/
│   ├── discord-rpc/
│   ├── system-monitor/
│   └── network-tools/
└── repository.json
```

## Plugin Installation Flow

When installing a plugin:

1. **Name-based search** (e.g., `discord-rpc`)
   - Check local plugins directory first
   - Search official repository second
   - Fall back to GitHub if not found

2. **URL-based install**
   - Fetch from provided GitHub URL
   - Auto-convert `github.com` → `raw.githubusercontent.com`

3. **Installation**
   - Download plugin file
   - Save to temporary location
   - Load and verify plugin
   - Move to `plugins/` directory
   - Clean up temporary files

## Available Services

Plugins receive access to InvolveX services:

```javascript
constructor(services) {
  this.logService = services.log;           // Logging
  this.animationHelper = services.animation; // UI animations
  this.cacheService = services.cache;       // Cache operations
  this.packageManager = services.packageManager;
  this.storage = services.storage;
  this.uninstaller = services.uninstaller;
  this.settings = services.settings;
}
```

## Troubleshooting

### Plugin won't load

- Check `manifest.json` is valid JSON
- Verify `entry` file path is correct
- Check plugin exports are correct (should use `module.exports`)
- Review logs: `src/logs/update.log`

### Plugin installation fails

- Verify GitHub URL is accessible
- Check plugin file is valid JavaScript
- Ensure plugin class is properly exported

### Plugin menu not appearing

- Verify `getMenuItems()` method exists
- Check menu items have required fields: `name`, `description`, `handler`
- Ensure plugin is loaded (check `--plugins list`)

## Contributing

To contribute plugins to the official repository:

1. Fork https://github.com/involvex/involvex-plugins
2. Create plugin directory: `plugins/my-plugin/`
3. Add plugin code and manifest
4. Submit pull request

See official repository README for details.

## License

- Official plugins: MIT License
- Custom plugins: See individual plugin licenses

---

**Need help?** Visit [PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) for full documentation.
