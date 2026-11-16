/** Fill the catalogue viewport before the WebGL camera measures its stage.
 * The full invitation keeps its authored phone frame and camera proportions. */
export function journeyCatalogFrame(preview:boolean,thumbnail:unknown){
 const catalogue=preview&&(thumbnail||new URLSearchParams(location.search).get('embedded')==='1');
 return catalogue?'<style data-catalog-framing>#stage{top:0;left:0;width:100vw;height:100dvh;transform:none;border:0;border-radius:0;box-shadow:none}#stage::after{display:none}</style>':'';
}
