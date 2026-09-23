/* eslint-env node */

import {TextDecoder, TextEncoder} from 'util';
import '@testing-library/jest-dom';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
