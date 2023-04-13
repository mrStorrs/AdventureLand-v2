@echo off
start "" cmd /k "cd C:\Users\cjsto\caracAL\additional_programs\loki && loki.exe -config.file=C:\Users\cjsto\caracAL\additional_programs\loki\config.yaml"
start "" cmd /k "cd C:\Users\cjsto\caracAL\additional_programs\promtail && pt.exe -config.file=config.yaml"
start "" cmd /k "cd C:\Users\cjsto\caracAL && node main.js"
exit