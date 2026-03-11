/**
 * Composable for handling paste events in textareas.
 * Intercepts HTML pastes and converts links to Markdown format.
 */

export function usePaste() {
    const handlePaste = (e, targetObject, targetField) => {
        // Let the browser handle standard text paste natively if no HTML is present
        const htmlPattern = /<(?:.|\n)*?>/gm;
        const htmlData = e.clipboardData.getData('text/html');

        if (htmlData && htmlPattern.test(htmlData)) {
            // Prevent the default paste
            e.preventDefault();

            // Create a temporary DOM element to parse the HTML and extract text and links
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlData;

            // Convert links `<a>` to `[text](url)`
            const links = tempDiv.querySelectorAll('a');
            links.forEach(link => {
                const url = link.getAttribute('href');
                const text = link.textContent || link.innerText;
                if (url) {
                    const replacementText = document.createTextNode(`[${text}](${url})`);
                    link.parentNode.replaceChild(replacementText, link);
                }
            });

            // Get the compiled text string (preserves some basic text structure from the div processing)
            let processedText = tempDiv.textContent || tempDiv.innerText;
            processedText = processedText ? processedText.trim() : '';

            if (processedText) {
                // Find cursor position
                const textarea = e.target;
                const startPos = textarea.selectionStart;
                const endPos = textarea.selectionEnd;

                const currentText = targetObject[targetField] || '';
                const textBefore = currentText.substring(0, startPos);
                const textAfter = currentText.substring(endPos, currentText.length);

                targetObject[targetField] = textBefore + processedText + textAfter;

                // Need to await next tick or use timeout to restore cursor position after v-model updates
                setTimeout(() => {
                    textarea.selectionStart = startPos + processedText.length;
                    textarea.selectionEnd = startPos + processedText.length;
                }, 0);
            }
        }
    }

    return {
        handlePaste
    }
}
