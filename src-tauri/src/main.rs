// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rust_search::{similarity_sort, SearchBuilder};
use serde::Serialize;
use specta::{collect_types, Type};
use std::time::SystemTime;
use std::{collections::HashMap, fs::metadata, os::unix::fs::MetadataExt, time::Instant};
use tauri_specta::ts;

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

#[tauri::command]
#[specta::specta]
async fn timer() -> () {
    println!("Timer scheduled!");
    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    println!("Timer elapsed!");
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
            .invoke_handler(tauri::generate_handler![get_contents, search])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}

#[allow(dead_code)]
fn export_bindings() {
    ts::export(
        collect_types![get_contents, search],
        "../src/bindings.ts",
    )
    .unwrap();
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
