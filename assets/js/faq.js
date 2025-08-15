document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('faq-search');
    const searchClear = document.getElementById('search-clear');
    const searchResults = document.querySelector('.search-results');
    const expandAllBtn = document.getElementById('expand-all');
    const collapseAllBtn = document.getElementById('collapse-all');
    const faqQuestions = document.querySelectorAll('.faq-question');
    const copyButtons = document.querySelectorAll('.copy-button');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
        });
    });

    expandAllBtn.addEventListener('click', function() {
        faqQuestions.forEach(question => {
            question.setAttribute('aria-expanded', 'true');
        });
    });

    collapseAllBtn.addEventListener('click', function() {
        faqQuestions.forEach(question => {
            question.setAttribute('aria-expanded', 'false');
        });
    });

    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        filterFAQ('');
    });

    searchInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        searchClear.classList.toggle('visible', query.length > 0);
        filterFAQ(query);
    });

    function filterFAQ(query) {
        let visibleItems = 0;
        const sections = document.querySelectorAll('.faq-section');
        
        sections.forEach(section => {
            const items = section.querySelectorAll('.faq-item');
            let sectionHasVisible = false;
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                const isVisible = !query || text.includes(query);
                
                item.classList.toggle('hidden', !isVisible);
                
                if (isVisible) {
                    visibleItems++;
                    sectionHasVisible = true;
                    
                    item.querySelectorAll('.search-highlight').forEach(highlight => {
                        highlight.replaceWith(document.createTextNode(highlight.textContent));
                    });
                    
                    if (query) {
                        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
                        highlightText(item, regex);
                    }
                }
            });
            
            section.classList.toggle('hidden', !sectionHasVisible);
        });
        
        if (query) {
            searchResults.textContent = visibleItems 
                ? `${visibleItems} result${visibleItems !== 1 ? 's' : ''} found`
                : 'No results found';
        } else {
            searchResults.textContent = '';
        }
    }

    function highlightText(element, regex) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            if (textNode.textContent.match(regex)) {
                const span = document.createElement('span');
                span.innerHTML = textNode.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
                textNode.replaceWith(...span.childNodes);
            }
        });
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    copyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const codeBlock = this.closest('.code-block-container').querySelector('code');
            if (codeBlock) {
                try {
                    await navigator.clipboard.writeText(codeBlock.innerText);
                    const originalText = this.textContent;
                    const originalSvg = this.querySelector('svg').outerHTML;
                    
                    this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg> Copied!';
                    this.style.backgroundColor = 'var(--color-teal-300)';
                    this.style.color = 'var(--color-background)';
                    this.style.borderColor = 'var(--color-teal-300)';

                    setTimeout(() => {
                        this.innerHTML = originalSvg + originalText;
                        this.style.backgroundColor = '';
                        this.style.color = 'var(--color-text-secondary)';
                        this.style.borderColor = 'var(--color-card-border)';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    alert('Failed to copy code. Please try again or copy manually.');
                }
            }
        });
    });
});