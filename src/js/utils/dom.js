export const waitForElement = (id) => {
    return new Promise((resolve) => {
        const element = document.getElementById(id);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.getElementById(id);
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });
};