#!/bin/bash
# usage: qc_sheet.sh N  -> work/qc/clip-N-sheet.jpg (6 frames: first, 20%,40%,60%,80%, last) 3x2 at 360x640
set -e; N=$1; A=assets/output/kerala-christian-v1; F=$A/clip-$N.mp4; O=work/qc/c$N; mkdir -p $O
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $F)
L=$((NF-1)); sel=""; for i in 0 $((L/5)) $((2*L/5)) $((3*L/5)) $((4*L/5)) $L; do sel="$sel+eq(n\,$i)"; done; sel=${sel:1}
ffmpeg -v error -y -i $F -vf "select='$sel',scale=360:640,drawtext=text='%{n}':x=8:y=8:fontsize=28:fontcolor=yellow:box=1:boxcolor=black" -vsync 0 $O/f%02d.png
ffmpeg -v error -y -i $O/f%02d.png -vf "tile=3x2" -frames:v 1 work/qc/clip-$N-sheet.jpg
echo "clip-$N frames=$NF"
