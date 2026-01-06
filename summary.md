# Water Rendering Demos

22 standalone WebGL demos exploring water rendering techniques.

**View:** `python3 -m http.server 8080` then open http://localhost:8080

## Demos

### Basic Waves
| # | Name | Technique |
|---|------|-----------|
| 01 | Sine Waves | Additive sine functions |
| 02 | Gerstner Waves | Circular particle orbits, peaked crests |
| 03 | Perlin Noise | fBm for organic surfaces |
| 04 | Simplex Flow | Domain warping for currents |

### Surface Effects
| # | Name | Technique |
|---|------|-----------|
| 05 | Caustics | Overlapping wave patterns focusing light |
| 06 | Ripples | Interactive interference patterns |
| 07 | Flow Map | Two-phase UV scrolling (no seams) |
| 08 | Normal Map | Procedural normals from noise derivatives |
| 09 | Scrolling UV | Multi-layer texture scrolling |

### Reflections & Light
| # | Name | Technique |
|---|------|-----------|
| 10 | Fresnel | Angle-dependent reflection/refraction blend |
| 11 | Reflection/Refraction | Split view with chromatic aberration |
| 12 | Subsurface Scattering | Light through thin water volumes |

### 3D Techniques
| # | Name | Technique |
|---|------|-----------|
| 13 | Raymarched | SDF raymarching through water |
| 14 | Vertex Displacement | Real mesh with vertex shader waves |
| 15 | FFT Ocean | Simplified Tessendorf spectrum |

### Particles & Physics
| # | Name | Technique |
|---|------|-----------|
| 16 | Particles | Point sprites for spray/mist |
| 17 | Height Field | 2D wave equation simulation |
| 18 | Voronoi | Cellular patterns for caustics |

### Wave Faces (Surfing-Specific)
| # | Name | Technique |
|---|------|-----------|
| 19 | Foam | Jacobian-based whitecap detection |
| 20 | Breaking Wave | Asymmetric profile with steep face |
| 21 | Barrel | Inside-the-tube view |
| 22 | Face Flow | Water sucked up the wave face |

## Key Techniques Explained (Plain English)

### Gerstner Waves (Demo 02)
Regular sine waves just go up and down. Gerstner waves move water particles in *circles*—up, forward, down, back. This creates:
- Sharp peaked crests (water bunches up at the top)
- Flat troughs (water spreads out at the bottom)

This is why real ocean waves look pointy at the top, not smooth like a sine curve.

### Jacobian / Wave Folding (Demo 19)
Imagine stretching a rubber sheet. The **Jacobian** measures how much the sheet is being stretched or compressed at each point.

When a wave gets too steep, water at the top moves forward faster than water below—the surface starts to "fold over" like a breaking wave. The Jacobian goes negative (compression), and that's where foam appears.

**TL;DR:** Jacobian < 1 means "wave is bunching up here" → add foam.

### Flow Advection (Demo 22)
Water on a wave face doesn't just sit there—it gets *sucked upward* as the wave steepens. To show this:
1. Define a "flow field" (arrows showing which way water moves at each point)
2. For each pixel, trace backward along these arrows
3. Use where you end up to look up color/texture

This creates those streaky flow lines you see on glassy wave faces.

### Subsurface Scattering (Demo 12)
When water is thin (like a wave lip about to break), light passes *through* it instead of bouncing off. This makes thin areas glow with a greenish/turquoise color—the classic "green room" look inside a barrel.

**TL;DR:** Thin water = light shines through = glowy edges.

### Fresnel Effect (Demo 10)
Look straight down at water → you see through it (refraction).
Look at a glancing angle → you see reflections.

This is why the ocean looks like a mirror at the horizon but you can see fish near your feet.

### Caustics (Demo 05)
Wavy water surface acts like a bunch of tiny lenses. Light gets focused into bright squiggly lines on the sea floor (or pool bottom). We fake this by overlapping multiple wave patterns and making intersections brighter.

### Normal Maps (Demo 08)
Instead of actually making bumpy geometry, we just *pretend* the surface is bumpy when calculating lighting. A "normal" is the direction a surface faces—we perturb these directions with noise to fake ripples without any actual 3D mesh.

## Interactive Demos
- **06 Ripples**: Click to add ripple sources
- **16 Particles**: Click for spray bursts
- **17 Height Field**: Click for wave disturbances

## Tech Stack
- Vanilla WebGL (no libraries)
- GLSL fragment shaders
- HTML frames for navigation
