// ALLOWED for shared/http: itself, shared/error and any external package
import { ProblemException } from '@shared/error';
import { Injectable } from '@nestjs/common';
import { SHARED_HTTP_SAMPLE } from './lint-sample';

export const ALLOWED = [
  SHARED_HTTP_SAMPLE, // same shared module
  ProblemException, // http -> error
  Injectable, // external
];
