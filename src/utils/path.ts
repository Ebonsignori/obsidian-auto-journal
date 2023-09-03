// In Obsidian the separator is always `/` even on Windows, which allows us to use this simple implementation of path
export function dirname(path: string): string {
	return path.substring(0, path.lastIndexOf("/"));
}

export function join(...paths: string[]): string {
	paths = paths.filter((path) => path !== "");
	if (paths.length === 1) return paths[0];
	paths = paths.map((path) => path.replace(/\/$/, ""));
	return paths.join("/");
}

export function basename(path: string): string {
	return path.split("/").pop() || "";
}
