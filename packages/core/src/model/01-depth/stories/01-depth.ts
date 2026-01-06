import { defineStory } from '../../../test-utils';
import { initialMatrix } from '../model';

/**
 * Beach with deep channel in center.
 */
const story = defineStory({
  title: 'Beach with Channel',
  prose: `Gradient to shore. Channel is 1.5x deeper than edges (relative, not absolute).`,
  initialMatrix: initialMatrix(),
  assertInitialAscii: `
    FFFFFFFF
    EEFFFFEE
    DDFFFFDD
    CCFFFFCC
    BBDDDDBB
    44CCCC44
    33AAAA33
    22333322
    11222211
    --------
  `,
  captureTimes: [0],
  expectedAscii: `
    t=0s
    FFFFFFFF
    EEFFFFEE
    DDFFFFDD
    CCFFFFCC
    BBDDDDBB
    44CCCC44
    33AAAA33
    22333322
    11222211
    --------
  `,
});

export default story;
