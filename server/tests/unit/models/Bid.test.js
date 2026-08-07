const mongoose = require('mongoose');
const Bid = require('../../../src/models/Bid');
const ProfessionalTender = require('../../../src/models/ProfessionalTender');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

async function seedBidContext() {
  const owner = await createUser({ role: 'company' });
  const bidder = await createUser({ role: 'company' });
  const company = await Company.create({ name: 'Tender Co', user: owner._id });

  const tender = await ProfessionalTender.create({
    referenceNumber: `REF-${Date.now()}`,
    title: 'Road Construction',
    description: 'Build a road segment',
    procurementCategory: 'Construction',
    tenderType: 'works',
    workflowType: 'open',
    owner: owner._id,
    ownerRole: 'company',
    ownerEntity: company._id,
    ownerEntityModel: 'Company',
    procurement: { procuringEntity: 'City Authority' },
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { owner, bidder, tender };
}

function validCoverSheet() {
  return {
    companyName: 'Bidder Co',
    authorizedRepresentative: 'Jane Doe',
    companyEmail: 'bidder@test.com',
    companyPhone: '0911223344',
    totalBidValue: 250000,
    declarationAccepted: true,
  };
}

describe('Bid model', () => {
  it('rejects bids without accepted declaration', async () => {
    const { bidder, tender } = await seedBidContext();

    await expect(
      Bid.create({
        tender: tender._id,
        bidder: bidder._id,
        bidAmount: 250000,
        coverSheet: { ...validCoverSheet(), declarationAccepted: false },
      })
    ).rejects.toThrow();
  });

  it('auto-generates bidNumber on save', async () => {
    const { bidder, tender } = await seedBidContext();

    const bid = await Bid.create({
      tender: tender._id,
      bidder: bidder._id,
      bidAmount: 250000,
      coverSheet: validCoverSheet(),
    });

    expect(bid.bidNumber).toMatch(/^BID-/);
  });

  it('seal sets sealed flag and hash commitment', async () => {
    const { bidder, tender } = await seedBidContext();

    const bid = await Bid.create({
      tender: tender._id,
      bidder: bidder._id,
      bidAmount: 250000,
      coverSheet: validCoverSheet(),
    });

    bid.seal(bidder._id);

    expect(bid.sealed).toBe(true);
    expect(bid.sealedHash).toHaveLength(64);
  });

  it('toSafeObject masks financials for owner on sealed unrevealed bids', async () => {
    const { owner, bidder, tender } = await seedBidContext();

    const bid = await Bid.create({
      tender: tender._id,
      bidder: bidder._id,
      bidAmount: 250000,
      coverSheet: validCoverSheet(),
    });
    bid.seal(bidder._id);

    const safe = bid.toSafeObject(owner._id, true, false);

    expect(safe.bidAmount).toBeNull();
    expect(safe.sealedHash).toBeUndefined();
  });
});
