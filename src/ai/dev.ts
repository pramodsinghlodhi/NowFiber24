'use server';

import {config} from 'dotenv';
config();

import './flows/auto-fault-detection';
import './flows/analyze-materials-used';
import './flows/trace-route-flow';
