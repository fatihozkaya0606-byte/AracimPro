import fs from 'node:fs';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {dequantize} from '@gltf-transform/functions';

/**
 * Decode meshopt compression and quantization for Godot 4.4 GLB importer.
 * Public-source model credits MUST remain attached to the game.
 */
const files = process.argv.slice(2);
if(files.length===0)throw new Error('Need GLB paths');
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({'meshopt.decoder':MeshoptDecoder});
for(const file of files) {
    const input=await io.read(file);
    const used=input.getRoot().listExtensionsUsed();
    for(const extension of used) {
        if(extension.extensionName==='EXT_meshopt_compression') {
            extension.dispose();
        }
    }
    await input.transform(dequantize());
    for(const extension of input.getRoot().listExtensionsUsed()) {
        if(extension.extensionName==='KHR_mesh_quantization' || 
           extension.extensionName==='EXT_meshopt_compression') {
            extension.dispose();
        }
    }
    const temp=file+'.decoded.glb';
    await io.write(temp,input);
    const buf=fs.readFileSync(temp);
    if(buf.subarray(0,4).toString('ascii')!=='glTF')throw new Error('Bad GLB '+temp);
    const gltfChunkLen=buf.readUInt32LE(12);
    const json=JSON.parse(buf.subarray(20,20+gltfChunkLen).toString('utf8').trim());
    const req=json.extensionsRequired||[];
    if(req.includes('EXT_meshopt_compression')||req.includes('KHR_mesh_quantization')){
        throw new Error('Unsupported extension remains in '+temp+': '+JSON.stringify(req));
    }
    fs.renameSync(temp,file);
    console.log('GODOT_DECODED',path.basename(file),buf.length,'extensionsRequired=',req.join(','));
}
