import { defineToolcraft } from "@/toolcraft/runtime";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: true,
    size: {
      height: 1080,
      unit: "px",
      width: 1920,
    },
    sizing: { mode: "editable-output" },
    upload: false,
  },
  export: {
    png: {
      background: "include",
    },
  },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            image: {
              accept: "image/*",
              assetKind: "image",
              defaultValue: null,
              description:
                "Uses the uploaded image luminance as the dither source when no video source is present.",
              label: "Image",
              orderRole: "input",
              performanceReason:
                "Uploading a source image adds a media decode and source-sampling pass used by preview and exports.",
              performanceRole: "responsiveness",
              target: "source.image",
              type: "fileDrop",
            },
            invert: {
              defaultValue: false,
              description:
                "Swaps the uploaded image's light and dark values before dithering.",
              label: "Invert",
              orderRole: "detail",
              performanceReason:
                "Inverting a source image adds one constant luminance mapping step without changing the sampler or particle workload.",
              performanceRole: "responsiveness",
              target: "source.image.invert",
              type: "checkbox",
            },
          },
          layout: "standalone",
          title: "Source Image",
        },
        {
          controls: {
            video: {
              accept: "video/*",
              assetKind: "file",
              defaultValue: null,
              description:
                "Uses uploaded video frames as the animated dither source; when present it overrides Image.",
              label: "Video",
              orderRole: "input",
              performanceReason:
                "Uploading a source video adds a media decode and frame-sampling pass used by preview and video exports.",
              performanceRole: "responsiveness",
              target: "source.video",
              type: "fileDrop",
            },
            invert: {
              defaultValue: false,
              description:
                "Swaps the uploaded video's light and dark values before dithering.",
              label: "Invert",
              orderRole: "detail",
              performanceReason:
                "Inverting a source video adds one constant luminance mapping step without changing frame decoding or particle workload.",
              performanceRole: "responsiveness",
              target: "source.video.invert",
              type: "checkbox",
            },
          },
          layout: "standalone",
          title: "Source Video",
        },
        {
          controls: {
            particleType: {
              defaultValue: "cross",
              description:
                "Chooses which ASCII particle family is drawn in the pattern cells.",
              label: "Particle",
              options: [
                { label: "Crosses", value: "cross" },
                { label: "Mini dots", value: "dot" },
                { label: "Hachures", value: "hatch" },
                { label: "Mixed", value: "mixed" },
              ],
              orderRole: "mode",
              performanceReason:
                "Changing particle family can alter glyph draw paths across the full grid.",
              performanceRole: "workload",
              target: "pattern.particleType",
              type: "select",
            },
            scale: {
              defaultValue: 14,
              description:
                "Sets the drawn particle size; smaller values create finer ASCII marks.",
              label: "Scale",
              max: 28,
              min: 6,
              orderRole: "strength",
              performanceReason:
                "Scale changes particle size and, with spacing, the effective grid workload.",
              performanceRole: "workload",
              step: 1,
              target: "pattern.scale",
              type: "slider",
            },
            spacing: {
              defaultValue: -2,
              description:
                "Adjusts room between particle centers without enlarging the ASCII marks; negative values make the field tighter.",
              label: "Spacing",
              max: 24,
              min: -8,
              orderRole: "detail",
              performanceReason:
                "Spacing changes the grid step and total number of particles evaluated per frame.",
              performanceRole: "workload",
              step: 1,
              target: "pattern.spacing",
              type: "slider",
              unit: "px",
            },
            voids: {
              defaultValue: 1,
              description:
                "Controls how strongly the organic noise carves random empty zones through the particle field.",
              label: "Voids",
              max: 5,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Voids changes the organic mask and can increase visible particle count when reduced.",
              performanceRole: "workload",
              step: 0.05,
              target: "pattern.voids",
              type: "slider",
            },
            density: {
              defaultValue: 70,
              description:
                "Controls how many cells survive the random dither mask.",
              label: "Density",
              max: 100,
              min: 12,
              orderRole: "detail",
              performanceReason:
                "Density changes the number of visible particles drawn per frame.",
              performanceRole: "workload",
              step: 1,
              target: "pattern.density",
              type: "slider",
              unit: "%",
            },
          },
          title: "Pattern",
        },
        {
          controls: {
            speed: {
              defaultValue: 1,
              description:
                "Changes how far the procedural field travels during one seamless timeline loop.",
              label: "Speed",
              max: 3,
              min: 0.25,
              orderRole: "strength",
              performanceReason:
                "Speed changes animation phase distance while preserving the same renderer workload.",
              performanceRole: "responsiveness",
              step: 0.05,
              target: "motion.speed",
              type: "slider",
            },
          },
          title: "Motion",
        },
        {
          controls: {
            strength: {
              defaultValue: 1.6,
              description:
                "Sharpens the cutoff between sparse and dense dither regions.",
              label: "Strength",
              max: 2.4,
              min: 0.2,
              orderRole: "strength",
              performanceReason:
                "Strength changes per-cell intensity math without changing grid size.",
              performanceRole: "responsiveness",
              step: 0.05,
              target: "dither.strength",
              type: "slider",
            },
            contrast: {
              defaultValue: 2,
              description:
                "Progressively expands media tones and shadow detail across the full 0-to-3 range.",
              label: "Depth",
              max: 3,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Depth changes per-glyph color mapping without changing geometry, grid size, or particle count.",
              performanceRole: "responsiveness",
              step: 0.05,
              target: "dither.contrast",
              type: "slider",
            },
            threshold: {
              defaultValue: 0.6,
              description:
                "Moves the cutoff between black gaps and visible ASCII particles.",
              label: "Threshold",
              max: 0.9,
              min: 0.1,
              orderRole: "detail",
              performanceReason:
                "Threshold changes how many cells pass the visible-particle cutoff.",
              performanceRole: "workload",
              step: 0.01,
              target: "dither.threshold",
              type: "slider",
            },
          },
          title: "Dither",
        },
        {
          controls: {
            includeBackground: {
              defaultValue: true,
              label: "Include",
              orderRole: "color",
              performanceReason:
                "Background inclusion toggles product background fill without changing glyph workload.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              defaultValue: { hex: "#0A0C11" },
              label: false,
              orderRole: "color",
              performanceReason:
                "Background color changes a single fill operation.",
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "background"],
              layout: "inline",
            },
          ],
          title: "Background",
        },
        {
          controls: {
            imageFormat: {
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              orderRole: "mode",
              performanceReason:
                "Image format changes output encoding only during export.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              orderRole: "mode",
              performanceReason:
                "Image resolution changes export canvas dimensions only during export.",
              performanceRole: "workload",
              target: "export.image.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
          title: "Image Export",
        },
        {
          controls: {
            videoFormat: {
              defaultValue: "mp4",
              label: "Format",
              options: [
                { label: "MP4", value: "mp4" },
                { label: "WebM", value: "webm" },
                { label: "GIF", value: "gif" },
              ],
              orderRole: "mode",
              performanceReason:
                "Video format selects standard H.264 MP4, MediaRecorder WebM, or optimized palette GIF encoding during export.",
              performanceRole: "responsiveness",
              target: "export.video.format",
              type: "select",
            },
            videoResolution: {
              defaultValue: "current",
              label: "Resolution",
              options: [
                { label: "Current", value: "current" },
                { label: "4K", value: "4k" },
              ],
              orderRole: "mode",
              performanceReason:
                "Video resolution changes encoder canvas dimensions only during export.",
              performanceRole: "workload",
              target: "export.video.resolution",
              type: "select",
            },
            videoDuration: {
              defaultValue: "10",
              description:
                "Length of the exported video or GIF. The procedural field completes one seamless loop over this duration; an uploaded source video keeps its own speed and repeats.",
              label: "Duration",
              options: [
                { label: "5 s", value: "5" },
                { label: "10 s", value: "10" },
                { label: "15 s", value: "15" },
              ],
              orderRole: "mode",
              performanceReason:
                "Video duration changes the number of encoded frames only during export.",
              performanceRole: "responsiveness",
              target: "export.video.duration",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["videoFormat", "videoResolution"],
              layout: "inline",
            },
          ],
          title: "Video Export",
        },
        {
          controls: {
            outputActions: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export SVG",
                  value: "export.svg",
                  variant: "secondary",
                },
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  value: "export.png",
                  variant: "secondary",
                },
                {
                  icon: "upload-simple",
                  label: "Export Video",
                  value: "export.video",
                },
              ],
              target: "actions.output",
              type: "panelActions",
            },
          },
          title: "Export",
        },
      ],
      title: "CHEVAL NOIR DITHER",
    },
    timeline: {
      defaultDurationSeconds: 11.88166666666667,
      enabled: true,
      mode: "playback",
    },
  },
  persistence: {
    include: ["values", "canvas", "panels", "timeline"],
    key: "toolcraft:cheval-noir-dither:state:v1",
    storage: "localStorage",
    version: 1,
  },
  settingsTransfer: {
    appId: "cheval-noir-dither",
    fileName: "cheval-noir-dither-settings.json",
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
