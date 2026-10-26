import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'lil-gui'

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            // The envMap itself comes from scene.environment
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/**
 * Environment map
 */
const loadEnvironmentMap = (index) =>
{
    const environmentMap = cubeTextureLoader.load([
        `/textures/environmentMaps/${index}/px.jpg`,
        `/textures/environmentMaps/${index}/nx.jpg`,
        `/textures/environmentMaps/${index}/py.jpg`,
        `/textures/environmentMaps/${index}/ny.jpg`,
        `/textures/environmentMaps/${index}/pz.jpg`,
        `/textures/environmentMaps/${index}/nz.jpg`
    ])
    environmentMap.encoding = THREE.sRGBEncoding

    scene.background = environmentMap
    scene.environment = environmentMap

    updateAllMaterials()
}

debugObject.environmentMap = 0
loadEnvironmentMap(debugObject.environmentMap)

debugObject.envMapIntensity = 2.5
gui.add(debugObject, 'envMapIntensity').min(0).max(10).step(0.001).onChange(updateAllMaterials)
gui.add(debugObject, 'environmentMap', [0, 1, 2, 3]).onChange(loadEnvironmentMap)

/**
 * Models
 */
const models = {
    flightHelmet: {
        path: '/models/FlightHelmet/glTF/FlightHelmet.gltf',
        scale: 10,
        positionY: - 4,
        rotationY: Math.PI * 0.5
    },
    hamburger: {
        path: '/models/hamburger.glb',
        scale: 0.3,
        positionY: - 1,
        rotationY: 0
    }
}

let currentModel = null

const loadModel = (name) =>
{
    const settings = models[name]

    gltfLoader.load(
        settings.path,
        (gltf) =>
        {
            // Replace the previous model
            if(currentModel)
            {
                scene.remove(currentModel)
            }
            currentModel = gltf.scene

            gltf.scene.scale.set(settings.scale, settings.scale, settings.scale)
            gltf.scene.position.set(0, settings.positionY, 0)
            gltf.scene.rotation.y = settings.rotationY
            scene.add(gltf.scene)

            rotationTweak.object = gltf.scene.rotation
            rotationTweak.updateDisplay()

            updateAllMaterials()
        }
    )
}

debugObject.model = 'flightHelmet'
const rotationTweak = gui.add({ y: 0 }, 'y').min(- Math.PI).max(Math.PI).step(0.001).name('rotation')
gui.add(debugObject, 'model', { 'Flight Helmet': 'flightHelmet', Hamburger: 'hamburger' }).onChange(loadModel)

loadModel(debugObject.model)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
scene.add(directionalLight)

// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(directionalLightCameraHelper)

gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('lightIntensity')
gui.add(directionalLight.position, 'x').min(- 5).max(5).step(0.001).name('lightX')
gui.add(directionalLight.position, 'y').min(- 5).max(5).step(0.001).name('lightY')
gui.add(directionalLight.position, 'z').min(- 5).max(5).step(0.001).name('lightZ')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 1, - 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

gui
    .add(renderer, 'toneMapping', {
        No: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        ACESFilmic: THREE.ACESFilmicToneMapping
    })
    .onFinishChange(() =>
    {
        renderer.toneMapping = Number(renderer.toneMapping)
        updateAllMaterials()
    })
gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001)

/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
