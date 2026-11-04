import {useEffect,useState} from 'react';
import {completeGoogleSignIn,googleReturnPath} from './google-auth';
export default function AuthCallback(){
 const [error,setError]=useState(''),[returnTo]=useState(googleReturnPath);
 useEffect(()=>{let active=true;completeGoogleSignIn().then(path=>{if(active)location.replace(path);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 return <main className="tc-shell"><h1>{error?'Sign-in was not completed':'Signing you in with Google…'}</h1>{error?<><p role="alert">{error}</p><a className="fmi-button" href={returnTo}>Return to {returnTo.startsWith('/personalise')?'your invitation':'My invitations'}</a></>:<p role="status">Your invitation details and photos will be waiting for you.</p>}</main>;
}
