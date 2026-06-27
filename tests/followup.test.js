'use strict';
/**
 * followup.test.js
 * Test Case 2 (knowledge-base §7):
 * 15 gün önce istenmiş CA 19-9, Evidence Store'da yoksa [AÇIK DÖNGÜ] üretmeli.
 *
 * Çözüm: jest.mock factory içinde değişken erişimi yasak olduğundan,
 * __mocks__ klasörü yerine jest.resetModules + jest.doMock + require
 * döngüsü kullanarak tarihi dinamik olarak sağlıyoruz.
 */

'use strict';

describe('FollowupTracker — Açık Döngü Tespiti', () => {
  let trackFollowups;

  beforeAll(() => {
    jest.resetModules();

    // 15 gün önceki tarihi hesapla
    const d = new Date();
    d.setDate(d.getDate() - 15);
    const fifteenDaysAgo = d.toISOString().slice(0, 10);

    jest.doMock('../src/data/sampleNotes.json', () => [
      {
        documentId: 'doc_test_followup',
        sourceType: 'physician_note',
        author: 'Dr. Test',
        specialty: 'gastroenterology',
        date: fifteenDaysAgo,
        text: 'CA 19-9 tahlili istendi, kontrol USG planlandı.',
        requestedTests: ['CA 19-9', 'kontrol USG'],
      },
    ]);

    trackFollowups = require('../src/core/followupTracker').trackFollowups;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  const emptyEvidences = [];

  test('CA 19-9 için en az 1 followup üretmeli', () => {
    const followups = trackFollowups(emptyEvidences);
    const ca19 = followups.find((f) => f.key === 'ca19_9');
    expect(ca19).toBeDefined();
  });

  test('CA 19-9 durumu OPEN olmalı (>=14 gün geçti, sonuç yok)', () => {
    const followups = trackFollowups(emptyEvidences);
    const ca19 = followups.find((f) => f.key === 'ca19_9');
    expect(ca19.status).toBe('OPEN');
  });

  test('CA 19-9 mesajında [AÇIK DÖNGÜ] ifadesi bulunmalı', () => {
    const followups = trackFollowups(emptyEvidences);
    const ca19 = followups.find((f) => f.key === 'ca19_9');
    expect(ca19.message).toMatch(/\[AÇIK DÖNGÜ\]/);
  });

  test('daysSince değeri >= 14 olmalı', () => {
    const followups = trackFollowups(emptyEvidences);
    const ca19 = followups.find((f) => f.key === 'ca19_9');
    expect(ca19.daysSince).toBeGreaterThanOrEqual(14);
  });

  test('Kontrol USG de OPEN olmalı', () => {
    const followups = trackFollowups(emptyEvidences);
    const usg = followups.find((f) => f.key === 'abdomen_ultrasound');
    expect(usg).toBeDefined();
    expect(usg.status).toBe('OPEN');
  });
});

describe('FollowupTracker — Kapalı Döngü (Sonuç Mevcut)', () => {
  let trackFollowups;
  let closedEvidences;

  beforeAll(() => {
    jest.resetModules();

    const d15 = new Date();
    d15.setDate(d15.getDate() - 15);
    const fifteenDaysAgo = d15.toISOString().slice(0, 10);

    const d5 = new Date();
    d5.setDate(d5.getDate() - 5);
    const fiveDaysAgo = d5.toISOString().slice(0, 10);

    jest.doMock('../src/data/sampleNotes.json', () => [
      {
        documentId: 'doc_test_followup',
        sourceType: 'physician_note',
        date: fifteenDaysAgo,
        text: 'CA 19-9 tahlili istendi.',
        requestedTests: ['CA 19-9'],
      },
    ]);

    trackFollowups = require('../src/core/followupTracker').trackFollowups;

    closedEvidences = [
      {
        evidenceId: 'ev_ca19_result',
        sourceId: 'lab_ca19',
        sourceType: 'lab_report',
        date: fiveDaysAgo,
        category: 'laboratory',
        clinicalKey: 'ca19_9',
        value: 28,
        unit: 'U/mL',
        confidenceScore: 0,
        scoreFactors: [],
        rawTextSnippet: 'ca19_9: 28 U/mL',
      },
    ];
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('CA 19-9 sonucu varsa durum CLOSED olmalı', () => {
    const followups = trackFollowups(closedEvidences);
    const ca19 = followups.find((f) => f.key === 'ca19_9');
    expect(ca19).toBeDefined();
    expect(ca19.status).toBe('CLOSED');
  });
});
