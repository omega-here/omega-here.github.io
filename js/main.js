var TheOmega = null;
const socket = io('https://omega-here.hopto.org:443', {
    'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionDelayMax': 2000,
    'withCredentials': true
});

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const dropHandler = function(ev)
{
    ev.preventDefault();

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                var file = ev.dataTransfer.items[i].getAsFile();
                var reader = new FileReader();

                reader.onload = async function(e)
                {
                    window.cred = Base64.encode(e.target.result);
                    const stage1 = window.prompt("Please enter your passcode:");
                    const stage2 = CryptoJS.SHA256(stage1).toString();
                    const stage3 = CryptoJS.AES.encrypt(stage2, socket.id).toString();

                    try {
                        // Load core module from back-end into memory
                        // Don't worry, this is the only spot we ever use eval.. :p
                        const response = await socket.emitWithAck("auth", CryptoJS.AES.encrypt(JSON.stringify({"passcode": stage3, "file": window.cred}), socket.id).toString());
                        if (response.status == "OK") $.globalEval(response.data);
                    } catch (e) {
                        console.error(e);
                    }
                };
                
                reader.readAsText(file);
            }
        }
    } else {
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
        }
    }
};

const dragOverHandler = function(ev){
    ev.preventDefault();
};

const createScene = function()
{
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 15, new BABYLON.Vector3(0, -0.7, 0));
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

    BABYLON.SceneLoader.ImportMeshAsync("", "3D/", "omega.babylon").then(function(result)
    {
        TheOmega = scene.getMeshByName("omega");
        TheOmega.scaling = new BABYLON.Vector3(0.2,0.2,0.2);
        TheOmega.renderOutline = true;
        TheOmega.outlineWidth = 0.2;
        TheOmega.outlineColor = new BABYLON.Color3(0.15, 0, 0.4);
        TheOmega.renderOverlay = true;
        TheOmega.overlayColor = new BABYLON.Color3(0.15, 0, 0.4);
        TheOmega.overlayAlpha = 0.9;
        scene.clearColor = BABYLON.Color3.Black();
        var gl = new BABYLON.GlowLayer("glow", scene);

        gl.customEmissiveColorSelector = function(mesh, subMesh, material, result)
        {
            if (mesh.name === "omega")  result.set(0.1, 0, 0.5, 0.1);
            else result.set(0, 0, 0, 0);
        }

        window['theloop'] = function()
        {
            if (TheOmega) TheOmega.rotate(BABYLON.Axis.Z, Math.PI / 512);
        };
    });

    return scene;
};

engine.runRenderLoop(function()
{
    try {
        if (typeof window.theloop !== undefined) window.theloop();
    } catch (e) {}

    scene.render();
});

window.addEventListener("resize", function()
{
    engine.resize();
});

const scene = createScene();