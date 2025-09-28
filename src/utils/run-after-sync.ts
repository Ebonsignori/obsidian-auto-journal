let hasRun = false;

export function runAfterSync(callBack: any) {
	const sync = this.app?.internalPlugins?.plugins?.sync?.instance;
	if (!hasRun || !sync || sync.syncStatus?.toLowerCase() === "fully synced") {
		callBack();
		hasRun = true;
		return;
	}
	sync.on("status-change", () => {
		if (!hasRun && sync?.syncStatus?.toLowerCase() === "fully synced") {
			callBack();
			hasRun = true;
			return;
		}
	});
}
