import test from 'node:test';
import assert from 'node:assert/strict';
import {videoCustomerMessage} from '../shared/video-customer-message.mjs';

test('video form hides provider and implementation failures with a task-specific message',()=>{
 const fallback='Your photo could not be prepared. Please try again.';
 for(const message of ['Replicate 422 input failed','openai/gpt-image-2.6-flare','The provider could not confirm this request.','WebGL context lost','Prepared character dimensions do not match the master.','Approved movement tracks are missing.','The private video renderer is not configured yet.','Unexpected token < in JSON','Failed to fetch','Blob upload failed','https://internal.example/api/characters','TypeError: Cannot read properties of undefined'])assert.equal(videoCustomerMessage(message,fallback),fallback,message);
});
test('video form keeps actionable validation, payment and recovery guidance',()=>{
 assert.equal(videoCustomerMessage('The connection took too long. Please try again.'),'Reopen your invitation to check its latest saved status.');
 for(const message of ['Please enter the groom name.','This text is too long for its board. Please shorten it before downloading.','The photo has no visible subject. Choose another photo or a frame.','Tap Load preview to start the video on this device.','This invitation changed on another device. Your local edits are safe.','We could not confirm payment yet. Your draft is saved. Use Check payment status before paying again.','Use your included redo to change the reference photo.'])assert.equal(videoCustomerMessage(message),message);
 assert.equal(videoCustomerMessage(undefined,'Try again.'),'Try again.');
});
