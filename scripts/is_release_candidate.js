// eslint-disable-next-line @typescript-eslint/no-var-requires
const {releaseCandidate} = require('../package.json');

// coerce boolean to 0 or 1 and default undefined to 0
console.log(+!!releaseCandidate);
