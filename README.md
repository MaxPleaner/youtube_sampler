# youtube_sampler
a tampermonkey script to sample youtube videos

**TODO**

- [ ] Change this to a cross browser extension
- [ ] Support downloading audio and mp4, not just webm
- [ ] Make a website for it

**Installation**

1. Install [Tampermonkey Chrome Extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
    1. I haven't tested this on other browsers. It should work fine if they support MediaRecorder, however the media type (`video/webm`) might need to be changed.
  
2. Press "Create a new script" and paste in the contents of [youtube_sampler.js](https://github.com/MaxPleaner/youtube_sampler/blob/main/youtube_sampler.js). Make sure to read it first to check that it's nothing evil 😉. Control/Command + S to save and voila - you've done it.

**Usage**

1. Go to a Youtube video.
2. Use the sliders to control the start/end bounds of the loop
    a. It only works in 1-second increments; this is a limitation of Youtube's video player.
3. When you are ready to record, press "record"
4. Recording will automatically start and will stop when it's done
5. You will be prompted to enter a file name - can call it anything, but don't include the file extension here.
6. Press "result" to download the resulting webm file

**Converting to audio**

I wanted this to download just audio from the browser, but I couldn't figure it out (see [stackoverflow](https://stackoverflow.com/questions/67085323/capture-a-html5-video-players-audio-output)) But, it's not such a big deal, because webm can be converted to wav very easily:

```
# converts webm => wav
ffmpeg -i my_file.webm  -vn my_file.wav
```
