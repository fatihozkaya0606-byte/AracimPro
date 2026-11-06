# GALERİ KRALI 3D — Assets & attribution

The 3D gameplay code is original for this demo.

1. **Spectral GT RS**: CC0 1.0 by JaronKBragg7337. https://github.com/JaronKBragg7337/spectral-gt-rs  Source: `spectral_gt_rs_game_ready.glb`. License: https://creativecommons.org/publicdomain/zero/1.0/
2. **Car Concept**: © 2024 Darmstadt Graphics Group GmbH; Eric Chadwick (model and textures), CC BY 4.0. Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept  License: https://creativecommons.org/licenses/by/4.0/  Edited only by per-instance placement and scaling within the game.
3. **Cesium Man**: © 2017 Cesium, CC BY 4.0. Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMan  License: https://creativecommons.org/licenses/by/4.0/  Used as a temporary placeholder textured character, not as a final Özkaya character.

`premium.gd` instantiates these GLB models as real 3D geometry within the scene. The models are downloaded by the GitHub Actions build before the Godot asset import and included in the Android APK. They are not just pictures or 2D sprites. This is not a photorealistic finished game: vehicle physics and realistic town simulation remain in development.
