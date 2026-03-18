export function useParseDescription() {
    const tagColor = (text) => {
        const colors = [
            'red', 'orange', 'yellow', 'olive', 'green', 'teal',
            'blue', 'violet', 'purple', 'pink', 'brown', 'grey', 'black'
        ];

        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    const parseDescription = (description) => {
        if (!description) return [];

        let richText = description;

        // Links (Wikilinks format [label](url))
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        richText = richText.replace(linkRegex, '<a href="$2" target="_blank" onclick="event.stopPropagation()">$1</a>');

        // Tags (inicio da linha ou logo apos espaço em branco)
        const regex = /(^|\s)(#[\w]+)/g;
        richText = richText.replace(regex, (match, space, tagWithHash) => {
            const tag = tagWithHash.substring(1);
            const color = tagColor(tag);
            return `${space}<span class="ui ${color} tag label" style="margin-right: 0.3em;">${tag}</span>`;
        });

        // Breadcrumbs (lines with " > " separators)
        richText = richText.replace(/^(.+ > .+)$/gm, (match) => {
            const parts = match.split(' > ').map(p => p.trim());
            const last = parts.pop();
            const sections = parts.map(p => `<div class="section">${p}</div><i class="right chevron icon divider"></i>`).join('');
            return `<div class="ui breadcrumb">${sections}<div class="active section">${last}</div></div>`;
        });

        // Múltiplas linhas
        const lines = richText.split('\n');

        return lines;
    }

    return {
        parseDescription
    }
}
