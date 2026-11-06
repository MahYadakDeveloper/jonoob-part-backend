// ALLOWED for shared/ws: itself, shared/error and any external package
import { Injectable } from '@nestjs/common';
import { SHARED_WS_SAMPLE } from './lint-sample';
import { ProblemException } from '@shared/error';
import { MediaApi } from '../../../features/media/api/src';

export const ALLOWED = [
  SHARED_WS_SAMPLE, // same shared module
  ProblemException, // ws -> error
  Injectable, // external
];

const x: MediaApi