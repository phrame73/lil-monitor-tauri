// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use sysinfo::{System, ProcessRefreshKind, RefreshKind, MemoryRefreshKind, ProcessesToUpdate, CpuRefreshKind, Networks, Disks};
use std::sync::Mutex;
use tauri::State;

#[derive(serde::Serialize)]
struct ProcessInfo {
    name: String,
    memory: u64,
}

#[derive(serde::Serialize)]
struct DiskInfo {
    name: String,
    total: u64,
    available: u64,
    mount_point: String,
}

#[derive(serde::Serialize)]
struct NetworkInfo {
    rx_bytes: u64,
    tx_bytes: u64,
}

#[derive(serde::Serialize)]
struct SystemStats {
    free_memory: u64,
    total_memory: u64,
    used_memory: u64,
    top_processes: Vec<ProcessInfo>,
    cpu_usage: f32,
    disks: Vec<DiskInfo>,
    network: NetworkInfo,
}

struct AppState {
    system: Mutex<System>,
    disks: Mutex<Disks>,
    networks: Mutex<Networks>,
}

#[tauri::command]
async fn get_system_stats(state: State<'_, AppState>) -> Result<SystemStats, String> {
    let mut sys = state.system.lock().map_err(|_| "Failed to acquire lock system")?;
    let mut disks = state.disks.lock().map_err(|_| "Failed to acquire lock disks")?;
    let mut networks = state.networks.lock().map_err(|_| "Failed to acquire lock networks")?;
    
    sys.refresh_memory();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    sys.refresh_cpu_all();
    
    disks.refresh(true);      // Refresh usage of disks
    networks.refresh(true);   // Refresh network stats

    let total_memory = sys.total_memory();
    let free_memory = sys.free_memory();
    let used_memory = total_memory - free_memory;
    
    let mut processes: Vec<_> = sys.processes().values().collect();
    processes.sort_by(|a, b| b.memory().cmp(&a.memory()));

    let top_processes: Vec<ProcessInfo> = processes.iter()
        .take(10)
        .map(|p| ProcessInfo {
            name: p.name().to_string_lossy().into_owned(),
            memory: p.memory(),
        })
        .collect();
        
    let global_cpu_usage = sys.global_cpu_usage();

    // Disks
    let disks_info = disks.list().iter().map(|disk| DiskInfo {
        name: disk.name().to_string_lossy().into_owned(),
        total: disk.total_space(),
        available: disk.available_space(),
        mount_point: disk.mount_point().to_string_lossy().into_owned(),
    }).collect();

    // Network
    let (rx_bytes, tx_bytes) = networks.iter().fold((0, 0), |(rx, tx), (_, network)| {
        (rx + network.received(), tx + network.transmitted())
    });

    Ok(SystemStats {
        free_memory,
        total_memory,
        used_memory,
        top_processes,
        cpu_usage: global_cpu_usage,
        disks: disks_info,
        network: NetworkInfo { rx_bytes, tx_bytes },
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let system = System::new_with_specifics(
        RefreshKind::nothing()
            .with_memory(MemoryRefreshKind::everything())
            .with_processes(ProcessRefreshKind::everything())
            .with_cpu(CpuRefreshKind::everything()),
    );
    let disks = Disks::new_with_refreshed_list();
    let networks = Networks::new_with_refreshed_list();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            system: Mutex::new(system),
            disks: Mutex::new(disks),
            networks: Mutex::new(networks),
        })
        .invoke_handler(tauri::generate_handler![get_system_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
