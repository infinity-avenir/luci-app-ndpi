# luci-app-ndpi — Deep Packet Inspection for OpenWrt

A LuCI web interface and build system for [nDPI 6.0](https://github.com/ntop/nDPI) on OpenWrt 25.12+ routers, delivering real-time application-layer traffic analysis through an ntopng-style dashboard.

## What Is This?

**nDPI** (ntop Deep Packet Inspection) is an open-source library that identifies 489+ application protocols — TLS, QUIC, DNS, YouTube, Netflix, SSH, and hundreds more — by inspecting packet content rather than relying solely on port numbers.

**luci-app-ndpi** brings that capability to OpenWrt routers with:

- **Real-time DPI Dashboard** — a tab-based web interface showing detected protocols, active flows, live traffic rates, and security alerts, all accessible from the LuCI menu under *Services → nDPI Firewall*.
- **Top Protocols chart** — breaks down traffic by application protocol (TLS, SSH, QUIC, DNS, etc.) instead of just TCP/UDP.
- **Active Flows table** — shows every connection with source/destination IPs, detected protocol, category, bytes transferred, and duration.
- **DPI-based firewall rules** — block or rate-limit traffic by application protocol using iptables + the `xt_ndpi` kernel module.
- **Service management** — start/stop/enable the nDPI engine directly from the web interface.

## How It Works

### The DPI Snapshot Engine

The core challenge is that `ndpiReader` (the nDPI command-line tool) writes its JSON analysis only when it exits, not during live capture. The dashboard solves this with a **snapshot mechanism**:

1. **Trigger** — The LuCI controller launches a short-lived `ndpiReader` process that captures packets for 5 seconds (up to 1,000 packets):
   ```
   ndpiReader -i br-lan -K json -k /tmp/ndpi_snapshot.json -n 1000
   ```

2. **Signal** — After the capture window, the controller sends `SIGINT` (signal 2) to `ndpiReader`. This triggers a graceful shutdown that writes the complete DPI analysis to the JSON file. (`SIGTERM` does not produce output — `SIGINT` specifically is required.)

3. **Parse** — The controller reads the output file, which is in **NDJSON format** (one JSON object per line, per flow). Each line contains the detected protocol (`obj.ndpi.proto`), category, byte count, source/destination IPs, and other metadata.

4. **Aggregate** — The parsed flows are aggregated by protocol name to produce the Top Protocols chart data, and individual flow records populate the Active Flows table.

5. **Throttle** — Snapshots are rate-limited to one every 20 seconds to avoid overloading the router.

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  Browser (LuCI Dashboard)                            │
│  ndpi-dashboard.js  ←──AJAX──→  /cgi-bin/luci/...    │
└──────────────────────────────────────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │  Lua Controller            │
                        │  controller/ndpi.lua       │
                        │                            │
                        │  • api_protocols()          │
                        │  • api_flows()              │
                        │  • api_traffic()            │
                        │  • api_service_control()    │
                        │  • trigger_snapshot()        │
                        └─────────────┬─────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │           ndpiReader                │
                    │  (5-sec capture → SIGINT → JSON)    │
                    │  /tmp/ndpi_snapshot.json (NDJSON)   │
                    └────────────────────────────────────┘
```

### Packages Produced by the Build System

| Package | Type | Description |
|---------|------|-------------|
| `libndpi` | Shared library | nDPI protocol detection engine (`libndpi.so`) |
| `ndpi-tools` | Userspace binary | `ndpiReader` CLI for traffic analysis |
| `kmod-ndpi-netfilter` | Kernel module | `xt_ndpi.ko` for iptables protocol matching |
| `luci-app-ndpi` | LuCI app (noarch) | Web dashboard, controller, CBI models, JS/CSS assets |

## Supported Hardware

| Target Key | Device | CPU | Architecture |
|------------|--------|-----|--------------|
| `glinet_mt6000` | GL.iNet GL-MT6000 Flint 2 | MediaTek MT7986AV | aarch64_cortex-a53 |
| `glinet_mt3000` | GL.iNet GL-MT3000 Beryl AX | MediaTek MT7981BA | aarch64_cortex-a53 |
| `glinet_mt3600be` | GL.iNet GL-MT3600BE Beryl 7 | MediaTek MT7987AV | aarch64_cortex-a53 |
| `linksys_wrt1200ac` | Linksys WRT1200AC | Marvell Armada 385 | arm_cortex-a9_vfpv3-d16 |
| `linksys_wrt1900ac` | Linksys WRT1900AC/ACS | Marvell Armada 385 | arm_cortex-a9_vfpv3-d16 |
| `linksys_wrt3200acm` | Linksys WRT3200ACM | Marvell Armada 385 | arm_cortex-a9_vfpv3-d16 |
| `linksys_wrt32x` | Linksys WRT32X | Marvell Armada 385 | arm_cortex-a9_vfpv3-d16 |

## Installation

### Option A: Install the Pre-Built APK (Quickest)

The pre-built `luci-app-ndpi-1.0.0-r2.apk` package is ready to install on OpenWrt 25.12+ routers.

**Prerequisites:** Your router must already have `ndpi-tools`, `luci-base`, `luci-compat`, `rpcd`, and `jshn` installed.

1. Copy the APK to your router:
   ```bash
   scp luci-app-ndpi-1.0.0-r2.apk root@<router-ip>:/tmp/
   ```

2. Install the package:
   ```bash
   ssh root@<router-ip>
   apk add --allow-untrusted /tmp/luci-app-ndpi-1.0.0-r2.apk
   ```

3. Clear the LuCI cache and restart the web server:
   ```bash
   rm -rf /tmp/luci-*
   /etc/init.d/uhttpd restart
   ```

4. Open your router's LuCI interface and navigate to **Services → nDPI Firewall**.

### Option B: Build from Source

Building from source cross-compiles nDPI and the LuCI app through the full OpenWrt build system, producing native APK v3 packages.

#### Host Requirements

- **OS:** Linux (Ubuntu 22.04+ recommended)
- **Disk:** ~15 GB free per target
- **Packages:**
  ```bash
  sudo apt-get install build-essential libncurses-dev gawk unzip wget \
      git rsync python3 file
  ```

#### Build Steps

1. **Extract the source archive** (if using the zip):
   ```bash
   unzip luci-app-ndpi-1.0.0-r2-source.zip
   ```

2. **Build for a single target** (e.g., GL-MT6000):
   ```bash
   python3 build_ndpi_apk.py \
       --targets glinet_mt6000 \
       --openwrt-branch v25.12.5 \
       --luci-src ./luci-app-ndpi-1.0.0-r2-source
   ```

3. **Build for all supported targets:**
   ```bash
   python3 build_ndpi_apk.py --targets all
   ```

4. **List available targets:**
   ```bash
   python3 build_ndpi_apk.py --list-targets
   ```

5. **Speed up the build** with parallel jobs:
   ```bash
   python3 build_ndpi_apk.py --targets glinet_mt6000 -j $(nproc)
   ```

Output APK files are placed under `build/output/<target>/`.

#### Using the Wrapper Script (fix_luci_apk.py)

`fix_luci_apk.py` is a convenience wrapper that validates the source package before building and verifies the output APK afterwards:

```bash
python3 fix_luci_apk.py \
    --source ./luci-app-ndpi-1.0.0-r2-source \
    --target glinet_mt6000 \
    --openwrt-ref v25.12.5
```

It performs these checks automatically:

- **Pre-build:** Confirms `PKGARCH:=noarch` in the source Makefile and verifies all required runtime dependencies (`luci-base`, `luci-compat`, `rpcd`, `jshn`, `ndpi-tools`) are declared.
- **Post-build:** Inspects the output APK metadata with `apk adbdump` to confirm the package name, architecture, and dependency list are correct.

#### Build Pipeline Overview

The build system (`build_ndpi_apk.py`) executes this pipeline for each target:

1. Clone OpenWrt at the specified release tag (shallow clone)
2. Update and install OpenWrt package feeds
3. Clean any stale nDPI build artifacts
4. Pre-download the nDPI 6.0 source tarball into `dl/`
5. Inject the nDPI package Makefile into the OpenWrt tree
6. Copy the luci-app-ndpi source into `package/luci-app-ndpi/`
7. Generate `.config` for the target with `CONFIG_USE_APK=y`
8. Build host tools, the cross-compilation toolchain, and all nDPI packages
9. Collect `.apk` outputs into `build/output/<target>/`

## Source Code Structure

```
luci-app-ndpi-1.0.0-r2-source/
├── Makefile                        # OpenWrt package Makefile (PKGARCH:=noarch)
├── htdocs/
│   └── luci-static/ndpi/
│       ├── css/ndpi-dashboard.css   # Dashboard styles
│       └── js/ndpi-dashboard.js     # Dashboard JavaScript (AJAX, charts, tabs)
├── luasrc/
│   ├── controller/ndpi.lua          # Main controller: API endpoints, snapshot engine
│   ├── model/cbi/ndpi/              # CBI configuration models
│   └── view/ndpi/
│       └── dashboard.htm            # Dashboard HTML template
└── root/
    ├── etc/
    │   ├── config/ndpi              # UCI default configuration
    │   ├── init.d/ndpi              # Procd init script
    │   └── uci-defaults/40_luci-ndpi
    ├── usr/
    │   ├── libexec/rpcd/ndpi        # rpcd backend script
    │   └── share/
    │       ├── luci/menu.d/luci-app-ndpi.json  # LuCI menu entry
    │       └── rpcd/acl.d/luci-app-ndpi.json   # ACL permissions
```

## Build System Files

| File | Purpose |
|------|---------|
| `build_ndpi_apk.py` | Cross-compilation orchestrator. Clones OpenWrt, injects nDPI packages, configures targets, and builds native APK v3 packages. |
| `fix_luci_apk.py` | Validation wrapper. Checks source Makefile correctness before building, verifies output APK metadata after building. |

## Troubleshooting

**"Top Protocols only shows TCP/UDP"** — The dashboard is falling back to conntrack (Layer 4) data because the DPI snapshot hasn't run yet. Click "Start" on the service control, wait 20 seconds for the first snapshot, then refresh.

**"0 active flows"** — Same root cause. The snapshot engine needs a running capture. Ensure `ndpiReader` is installed (`which ndpiReader`) and the monitored interface (default `br-lan`) exists.

**APK install fails with dependency errors** — Install the dependencies first:
```bash
apk add luci-base luci-compat rpcd jshn ndpi-tools
```

**Build produces .ipk instead of .apk** — The build system forces `CONFIG_USE_APK=y`, but `make defconfig` can strip it. The script detects and re-forces this automatically. If it still fails, ensure you're building against OpenWrt 25.12+ (APK support was added in this release).

## License

GPL-2.0-or-later

## Screenshot

<img width="1498" height="1133" alt="image" src="https://github.com/user-attachments/assets/8b9e2246-2766-40aa-a957-24d9ec575467" /> <br>
<br>
<img width="1461" height="881" alt="image" src="https://github.com/user-attachments/assets/c4017863-7abd-4770-bafa-f1bce80a6f85" /> <br>
<br>
<img width="1507" height="714" alt="image" src="https://github.com/user-attachments/assets/1397f8a1-7fd9-4dfd-89f3-cbbd2a2f5f04" /><br>
<br>
<img width="1507" height="781" alt="image" src="https://github.com/user-attachments/assets/9695ccc9-b0b7-4d1b-9c10-8b94d2372884" /><br>
<br>
<img width="1482" height="1058" alt="image" src="https://github.com/user-attachments/assets/365cf59d-a21e-4614-a439-83f1a885dfb1" /><br>
<br>
<img width="1415" height="1171" alt="image" src="https://github.com/user-attachments/assets/d3480559-5e0f-4857-8e7c-3156b22d3796" /><br>
<br>
<img width="1437" height="1077" alt="image" src="https://github.com/user-attachments/assets/05f0efbc-ea8d-43a4-9a4a-bd40352a39a0" /><br>
<br>
<img width="1538" height="935" alt="image" src="https://github.com/user-attachments/assets/4f7e6f2d-8c27-4f6f-b340-c1a58dde97ef" /><br>
<br>
<img width="1290" height="1044" alt="image" src="https://github.com/user-attachments/assets/3cfbb962-8960-4db8-8e47-1f6bd15ce296" /><br>
<br>
<img width="1492" height="1020" alt="image" src="https://github.com/user-attachments/assets/2c96fb31-6829-44bd-bc4f-aeb811c35235" /><br>









