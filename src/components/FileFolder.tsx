import { FileFolderMetadata } from "../bindings";
import { formatEpochSeconds, formatSize } from "../utils";

export function FileFolder(props: { fileMetadata: FileFolderMetadata }) {
  return (
    <div className="flex flex-row w-full gap-4">
      <div className="w-1/2">{props.fileMetadata.name}</div>
      <div className="w-[1fr] flex-grow">
        {props.fileMetadata.is_folder
          ? "Folder"
          : formatSize(props.fileMetadata.size)}
      </div>

      <div className="w-[1fr] flex-grow text-right">
        {props.fileMetadata.modified
          ? formatEpochSeconds(props.fileMetadata.modified)
          : "—"}
      </div>
    </div>
  );
}
export default FileFolder;
