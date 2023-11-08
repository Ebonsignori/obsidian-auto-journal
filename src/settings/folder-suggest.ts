import { TAbstractFile, TFolder } from "obsidian";
import fuzzysort from "fuzzysort";
import { highlightSearch } from "src/utils/misc";
import { TextInputSuggest } from "src/utils/suggest";

export class FolderSuggest extends TextInputSuggest<
	Fuzzysort.KeyResult<TFolder>
> {
	getSuggestions(inputStr: string): Fuzzysort.KeyResult<TFolder>[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		abstractFiles.forEach((folder: TAbstractFile) => {
			if (
				folder instanceof TFolder &&
				folder.path.toLowerCase().contains(lowerCaseInputStr)
			) {
				folders.push(folder);
			}
		});

		return fuzzysort.go(lowerCaseInputStr, abstractFiles, {
			key: "path",
		}) as any;
	}

	renderSuggestion(
		file: Fuzzysort.KeyResult<TFolder>,
		el: HTMLElement
	): void {
		highlightSearch(el, file);
	}

	selectSuggestion(file: Fuzzysort.KeyResult<TFolder>): void {
		this.inputEl.value = file?.obj?.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
