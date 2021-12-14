import {
  isDraftCraftFairApplication,
  SubmittedCraftFairApplication,
  SubmittedCraftFairApplicationListRunType,
  SubmittedCraftFairApplicationRunType,
} from "../interfaces/Applications";
import {
  clearEditingApplicationStore,
  loadFromEditingApplicationStore,
  saveToEditingApplicationStore,
} from "./EditingApplicationStore";
import { removeDraft } from "./DraftApplicationsManager";
import { ValidationError } from "runtypes";

const applicationListSubscribers: Array<() => void> = [];
let refreshingApplications = false;
let applications: Array<SubmittedCraftFairApplication> = [];
let applicationsError: string = "";

export const subscribeApplicationListChange = (subscriber: () => void) => {
  applicationListSubscribers.push(subscriber);
};

export const getApplications = () => applications;

export const getApplicationsError = () => applicationsError;

export const refreshApplicationsList = async () => {
  refreshingApplications = true;
  applicationsError = "";
  notifyApplicationListChangeSubscribers();
  try {
    const res = await fetch("/api/getApplications");
    const json: SubmittedCraftFairApplication[] =
      SubmittedCraftFairApplicationListRunType.check(await res.json());
    if (json) {
      applications = json;
    }
  } catch (err: any) {
    applicationsError = "Error processing list of applications from server: ";
    applications = [];
    if (err?.name === "ValidationError") {
      const validationError = err as ValidationError;
      if (validationError?.code === "CONTENT_INCORRECT") {
        console.error(
          "Error processing list of applications from server: ",
          validationError.details
        );
      }
    }
  }
  refreshingApplications = false;
  notifyApplicationListChangeSubscribers();
};

export const isRefreshingApplications = () => refreshingApplications;

export const submitEditingApplication = async (): Promise<void> => {
  const currentCraftApplication = loadFromEditingApplicationStore();
  if (!currentCraftApplication) {
    throw new Error("No current craft application available for submission.");
  }

  const body = JSON.stringify(currentCraftApplication);

  const options = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  };

  const submitResponse = await fetch("/api/submitCraftApplication", options);
  if (submitResponse.status === 200) {
    clearEditingApplicationStore();

    const json = await submitResponse.json();
    const submittedApplication =
      SubmittedCraftFairApplicationRunType.check(json);

    if (isDraftCraftFairApplication(currentCraftApplication)) {
      // Application was a draft. Now it has been successfully submitted it should be removed from
      // the drafts storage.
      removeDraft(currentCraftApplication.draftId);

      // Add the new application to the submitted applications list.
      applications.push(submittedApplication);
      notifyApplicationListChangeSubscribers();
    } else {
      const updateIndex = applications.findIndex(
        (a) => a.dbId === submittedApplication.dbId
      );
      if (updateIndex >= 0) {
        applications[updateIndex] = submittedApplication;
        notifyApplicationListChangeSubscribers();
      } else {
        refreshApplicationsList();
      }
    }
  } else {
    throw new Error(
      `Status code: ${submitResponse.status} when submitting application.`
    );
  }
};

// Copy an existing submission to the edit storage ready for use by a form.
export const prepareExistingSubmissionForEditing = (
  application: SubmittedCraftFairApplication
) => {
  saveToEditingApplicationStore(application);
};

const notifyApplicationListChangeSubscribers = () => {
  applicationListSubscribers.forEach((subscription) => subscription());
};
