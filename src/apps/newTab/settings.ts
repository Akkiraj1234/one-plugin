import { Setting } from 'obsidian';
import type { GitHubActivitySettings } from './types';

export const DEFAULT_GITHUB_ACTIVITY_SETTINGS: GitHubActivitySettings = { username: '', openInNewTab: true };

export interface GitHubActivitySettingsContext {
    settings: GitHubActivitySettings;
    updateSettings(updater: (current: GitHubActivitySettings) => void): Promise<void>;
}

export function renderGitHubActivitySettings(containerEl: HTMLElement, context: GitHubActivitySettingsContext): void {
    const { settings } = context;
    const updateSettings = (updater: (current: GitHubActivitySettings) => void): Promise<void> => context.updateSettings(updater);
    new Setting(containerEl)
        .setName('GitHub username')
        .setDesc('Public activity for this username is requested directly from GitHub when you open the widget.')
        .addText((text) => text.setPlaceholder('Octocat').setValue(settings.username)
            .onChange(async (value) => updateSettings((current) => { current.username = value.trim(); })));
    new Setting(containerEl)
        .setName('Open in a new tab')
        .setDesc('Open activity in an Obsidian workspace tab. Turn this off to use a small window instead.')
        .addToggle((toggle) => toggle.setValue(settings.openInNewTab)
            .onChange(async (value) => updateSettings((current) => { current.openInNewTab = value; })));
}
