import { DraftCraftFairApplication } from "../interfaces/Applications";

const MAX_DRAFTS = 10;
const DRAFTS_STORAGE_KEY = "vendorPortalDrafts";

export const getAvailableDraftId = (): number | null => {
  const drafts = getDraftsFromStore();
  const index = drafts.findIndex((v) => v === null);
  if (index === -1) {
    // No free draft slots.
    return null;
  }
  return index;
};

export const getDraftsFromStore =
  (): Array<DraftCraftFairApplication | null> => {
    const storedItem = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (storedItem) {
      return JSON.parse(storedItem);
    } else {
      return Array(MAX_DRAFTS).fill(null);
    }
  };

export const clearDraftFromStore = (draftId: number) => {
  const drafts = getDraftsFromStore();
  if (draftId >= 0 && draftId < MAX_DRAFTS) {
    drafts[draftId] = null;
  }

  storeDrafts(drafts);
};

export const writeDraftToStore = (application: DraftCraftFairApplication) => {
  const drafts: Array<DraftCraftFairApplication | null> = getDraftsFromStore();
  let index = application.draftId;
  drafts[index] = application;
  storeDrafts(drafts);
};

const storeDrafts = (drafts: Array<DraftCraftFairApplication | null>) => {
  window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
};
