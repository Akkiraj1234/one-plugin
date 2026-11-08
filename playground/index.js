const modules = [
    "./hobby_planner/hobby_manager/index.js",
    "./hobby_planner/hobby_planner/index.js"
];

async function main() {
    const element = document.querySelector(".app-shell");

    if (!element) {
        throw new Error("App shell element not found.");
    }

    for (const path of modules) {
        try {
            const module = await import(path);
            const Component = module.default;
            const instance = new Component(element);
            instance.render();

        } catch (error) {
            console.error(`Failed to load module: ${path}`, error);
        }
    }
}

main();
