import {templateToken} from '../templates/api';
import {downloadPrivateFile} from './private-download.mjs';
export type DownloadProgress={loaded:number;total:number;percent:number|null;secondsRemaining:number|null};
export const privateVideoFile=(url:string,onProgress?:(progress:DownloadProgress)=>void):Promise<Blob>=>downloadPrivateFile(url,{getToken:templateToken,onProgress});
