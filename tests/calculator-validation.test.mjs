import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatorInitial} from '../dist/calculator.js';
import {calculatorStageIssue} from '../dist/calculator-validation.js';
const adoption=()=>({...calculatorInitial(null),familyType:'adoption',dateKind:'actual',eventDate:'2026-11-01'});
test('adoption birth and court dates are required at the situation stage',()=>{const input=adoption();assert.equal(calculatorStageIssue(input,0).field,'childBirthDate');input.childBirthDate='2026-01-01';assert.equal(calculatorStageIssue(input,0).field,'adoptionApplicationDate');input.adoptionApplicationDate='2026-11-01';assert.equal(calculatorStageIssue(input,0),null);});
test('birth path never asks for adopted child date; dates cannot be reversed',()=>{const input=adoption();input.familyType='birth';assert.equal(calculatorStageIssue(input,0),null);input.familyType='foster';input.childBirthDate='2026-11-02';assert.equal(calculatorStageIssue(input,0).field,'childBirthDate');input.childBirthDate='2026-01-01';assert.equal(calculatorStageIssue(input,0),null);});
test('invalid count and insurance dates are checked at their own stage; unknown insurance stays allowed',()=>{const input=adoption();input.familyType='birth';input.count=0;assert.equal(calculatorStageIssue(input,0).field,'count');input.count=1;assert.equal(calculatorStageIssue(input,1),null);input.parents[0].insuranceFrom='2026-11-01';input.parents[0].insuranceTo='2026-10-01';assert.equal(calculatorStageIssue(input,1).field,'parents.0.insuranceTo');});
