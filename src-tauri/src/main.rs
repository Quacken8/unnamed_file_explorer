// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rust_search::{similarity_sort, SearchBuilder};
use serde::{Deserialize, Serialize};
use specta::{collect_types, Type};
use std::os::fd::{AsFd, AsRawFd, OwnedFd};
use std::sync::Arc;
use std::time::SystemTime;
use std::{collections::HashMap, fs::metadata, os::unix::fs::MetadataExt, time::Instant};
use tauri::Manager;
use tauri_specta::ts;

struct AppState {
    tty: Arc<parking_lot::Mutex<OwnedFd>>,
}

#[derive(Serialize, Type)]
struct FileSize {
    size: f64,
    order: u32,
}
fn bytes_to_size(bytes: u64) -> FileSize {
    let mut order = 0;
    let mut size = bytes as f64;
    while size >= 1024.0 {
        size /= 1024.0;
        order += 1;
    }
    FileSize { size, order }
}

#[derive(Serialize, Type)]
struct FileFolderMetadata {
    name: String,
    path: String,
    size: FileSize,
    modified: Option<u32>,
    is_folder: bool,
}

#[derive(Clone, Serialize, Deserialize, Type)]
struct TtyIO {
    bytes: Vec<u8>,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
#[specta::specta]
fn get_contents(path: &str) -> Result<Vec<FileFolderMetadata>, ()> {
    Ok(SearchBuilder::default()
        .location(path)
        .depth(1)
        .build()
        .filter_map(|p| metadata(&p).ok().map(|m| (m, p)))
        .map(|(m, p)| FileFolderMetadata {
            name: p.split('/').last().unwrap_or("—").to_string(),
            path: p.to_string(),
            size: bytes_to_size(m.size()),
            modified: m.modified().ok().and_then(|t| {
                t.duration_since(SystemTime::UNIX_EPOCH)
                    .ok()
                    .map(|d| d.as_secs() as u32)
            }),
            is_folder: m.is_dir(),
        })
        .collect())
}

#[tauri::command]
#[specta::specta]
async fn search(
    search_string: &str,
    search_location: &str,
    extension: Option<&str>,
) -> Result<Vec<String>, ()> {
    let mut res = SearchBuilder::default()
        .location(search_location)
        .search_input(search_string)
        // .more_locations(vec!["/anotherPath/to/search", "/keepAddingIfYouWant/"])
        .limit(1000);
    if let Some(ext) = extension {
        res = res.ext(ext);
    }
    let mut res: Vec<String> = res.ignore_case().hidden().build().collect();
    similarity_sort(&mut res, search_string);
    Ok(res)
}

fn spawn_tty(shell: &std::ffi::CStr, args: &[std::ffi::CString]) -> OwnedFd {
    unsafe {
        match nix::pty::forkpty(None, None).unwrap() {
            nix::pty::ForkptyResult::Child => {
                nix::unistd::execvp::<std::ffi::CString>(shell, args).unwrap();
                unreachable!()
            }
            nix::pty::ForkptyResult::Parent { child: _, master } => {
                let _ = nix::fcntl::fcntl(
                    master.as_raw_fd(),
                    nix::fcntl::FcntlArg::F_SETFL(nix::fcntl::OFlag::O_NONBLOCK),
                );
                master
            }
        }
    }
}

#[tauri::command]
#[specta::specta]
fn read_tty(app: tauri::AppHandle) -> TtyIO {
    let tty = app.state::<AppState>().tty.clone();
    let mut buf = vec![0u8; 1024];

    let len = nix::unistd::read(tty.lock().as_raw_fd(), &mut buf[0..]).unwrap_or(0);

    TtyIO {
        bytes: buf[0..len].into(),
    }
}

#[tauri::command]
#[specta::specta]
fn write_tty(app: tauri::AppHandle, io: TtyIO) {
    let tty = app.state::<AppState>().tty.clone();
    nix::unistd::write(tty.lock().as_fd(), &io.bytes).unwrap();
}

fn cache_dir() -> () {
    let start = Instant::now();
    let mut map: HashMap<String, Vec<String>> = HashMap::new();
    let curr_searching: String = "/".to_string();

    let paths: Vec<String> = SearchBuilder::default()
        .location(curr_searching)
        .hidden()
        .build()
        .collect();
    for path in &paths {
        if let Some(key) = path.split("/").last() {
            map.entry(key.to_string()).or_default().push(path.clone());
        }
    }

    println!(
        "cached {:?} unique file-/foldernames ({:?} total paths) in {:?}, the cache takes up {:?} MB",
        map.len(),
        map.values().map(|v| v.len()).sum::<usize>(),
        start.elapsed(),
        map.values()
            .flat_map(|vec| vec.iter().map(|s| size_of_val(s) + s.capacity()))
            .sum::<usize>() as f64 / 1024.0 / 1024.0)
}

fn main() {
    if cfg!(feature = "codegen") {
        export_bindings();
    } else {
        tauri::Builder::default()
            .manage(AppState {
                tty: Arc::new(parking_lot::Mutex::new(spawn_tty(c"sh", &[]))),
            })
            .invoke_handler(tauri::generate_handler![
                get_contents,
                search,
                read_tty,
                write_tty
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}

#[allow(dead_code)]
fn export_bindings() {
    static PATH: &str = "../src/bindings.ts";
    ts::Exporter::new(
        collect_types![get_contents, search, read_tty, write_tty],
        PATH,
    )
    .export()
    .unwrap();

    // let conf = specta::ts::ExportConfiguration::default();
    // let mut extra_types = String::new();
    // extra_types += &specta::ts::export::<TtyIO>(&conf).unwrap();

    // std::fs::OpenOptions::new()
    //     .write(true)
    //     .append(true)
    //     .open(PATH)
    //     .unwrap()
    //     .write(extra_types.as_bytes())
    //     .unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn bindings() {
        export_bindings();
    }

    #[test]
    fn test_cache_dir() {
        cache_dir();
    }
}
