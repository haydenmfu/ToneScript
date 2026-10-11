const globals = Object.fromEntries([
  'ArrayBuffer','AudioContext','Blob','Buffer','DataView','Float32Array','Float64Array',
  'Map','OfflineAudioContext','Promise','Set','TextDecoder','Uint8Array','URL','Worker',
  'cancelAnimationFrame','clearTimeout','console','crypto','document','fetch','performance',
  'process','requestAnimationFrame','self','setTimeout','structuredClone','window','Option',
  'AbortController','setInterval','clearInterval','localStorage','confirm','Image','DOMParser','XMLSerializer'
].map(name=>[name,'readonly']));
export default [{ignores:['node_modules/**','.venv/**','outputs/**','models/**']},{
  files:['**/*.mjs'],languageOptions:{ecmaVersion:2024,sourceType:'module',globals},
  rules:{'no-undef':'error','no-unreachable':'error','no-duplicate-case':'error','no-dupe-args':'error','no-dupe-keys':'error','no-constant-binary-expression':'error','no-unexpected-multiline':'error','valid-typeof':'error','no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}
}];
