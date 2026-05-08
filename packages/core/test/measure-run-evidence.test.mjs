import assert from 'node:assert/strict'
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import test from 'node:test'

import {
  measureRunEvidence,
  pack,
} from '../dist/index.js'

test('measures verification, structural comparison, and expected evidence', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-measure-run-'))
  try {
    const baselineInput = join(tempRoot, 'baseline-output')
    const candidateInput = join(tempRoot, 'candidate-output')
    const baseline = join(tempRoot, 'baseline.fpk')
    const candidate = join(tempRoot, 'candidate.fpk')

    await mkdir(baselineInput, {recursive: true})
    await mkdir(candidateInput, {recursive: true})
    await writeFile(join(baselineInput, 'agent-task-summary.md'), 'Task: checkout fix\nStatus: success\n')
    await writeFile(join(baselineInput, 'test-output.txt'), 'PASS smoke\n')
    await writeFile(join(candidateInput, 'agent-task-summary.md'), 'Task: checkout fix\nStatus: success\n')
    await writeFile(join(candidateInput, 'test-output.txt'), 'PASS smoke\nPASS checkout\n')
    await writeFile(join(candidateInput, 'metadata.json'), '{"run":"candidate"}\n')

    await pack({input: baselineInput, output: baseline})
    await pack({input: candidateInput, output: candidate})

    const measurement = await measureRunEvidence({
      baseline,
      candidate,
      expectedEvidencePaths: [
        'agent-task-summary.md',
        'test-output.txt',
        'missing-evidence.txt',
      ],
    })

    assert.equal(measurement.candidate.name, 'candidate-output')
    assert.equal(measurement.candidate.fileCount, 3)
    assert.equal(measurement.verification.ok, true)
    assert.equal(measurement.verification.mismatchCount, 0)
    assert.equal(measurement.comparison.ok, false)
    assert.equal(measurement.comparison.added, 1)
    assert.equal(measurement.comparison.changed, 1)
    assert.equal(measurement.comparison.removed, 0)
    assert.equal(measurement.comparison.totalChangedFiles, 2)
    assert.deepEqual(measurement.evidence.present, [
      'agent-task-summary.md',
      'test-output.txt',
    ])
    assert.deepEqual(measurement.evidence.missing, ['missing-evidence.txt'])
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('records optional review metadata without judging task correctness', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-measure-review-'))
  try {
    const input = join(tempRoot, 'agent-output')
    const candidate = join(tempRoot, 'candidate.fpk')

    await mkdir(input, {recursive: true})
    await writeFile(join(input, 'summary.md'), 'Run completed.\n')
    await pack({input, output: candidate})

    const measurement = await measureRunEvidence({
      candidate,
      review: {
        confidence: 'medium',
        decision: 'approved',
        endedAt: '2026-05-08T12:05:30.000Z',
        reusableByAnotherAgent: true,
        startedAt: '2026-05-08T12:00:00.000Z',
      },
    })

    assert.equal(measurement.comparison, undefined)
    assert.equal(measurement.evidence.missingCount, 0)
    assert.deepEqual(measurement.review, {
      confidence: 'medium',
      decision: 'approved',
      durationMs: 330000,
      endedAt: '2026-05-08T12:05:30.000Z',
      reusableByAnotherAgent: true,
      startedAt: '2026-05-08T12:00:00.000Z',
    })
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})
