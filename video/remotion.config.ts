// Studio and CLI settings. The Node rendering APIs ignore this file.
// All options: https://remotion.dev/docs/config
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// The map scene is WebGL (MapLibre); ANGLE renders it in headless Chrome.
Config.setChromiumOpenGlRenderer('angle');
