'use client';

import { FormEvent, useCallback, useRef, useState } from 'react';

import z, { ZodSchema } from 'zod';

import { RESPONSE_TYPES as RESPONSE } from '@/lib/constant';

type ResponseType = keyof typeof RESPONSE;

type SchemaFields<TSchema extends ZodSchema | undefined> =
  TSchema extends ZodSchema ? z.infer<TSchema> : Record<string, unknown>;

type Response<TFields, TData> = {
  ok?: boolean;
  type?: ResponseType;
  status?: number;
  error?: string;
  success?: string;
  message?: string;
  data?: TData;
  formData?: FormData;
  formErrors?: string[];
  formFields?: Partial<Record<keyof TFields, string>>;
  fieldErrors?: Partial<Record<keyof TFields, string[]>>;
};

export type UploadResponse = {
  ok?: boolean;
  url?: string;
  name?: string;
  error?: string;
  status?: number;
  message?: string;
  success?: string;
};

export type ClientFormSubmissionProps<
  TFields = Record<string, unknown>,
  TData = Record<string, unknown>,
  TSchema extends ZodSchema | undefined = undefined,
> = {
  action?: (formData: FormData) => Promise<Response<TFields, TData>>;
  uploadAction?: (formData: FormData) => Promise<UploadResponse>;
  endpoint?: string;
  onError?: (args: { type: string; status?: number; message: string }) => void;
  onSuccess?: (data: Response<TFields, TData>) => void;
  onErrorRedirect?: string;
  onSuccessRedirect?: string;
  fileKey?: string;
  enableUpload?: boolean;
  uploadFileRoute?: string;
  schema?: TSchema;
  isFormDisabled?: boolean;
  noFormData?: boolean;
};

const INITIAL_STATUS = {
  isError: false,
  isLoading: false,
  isPending: false,
  isSuccess: false,
  isFinished: false,
  isFetching: false,
  isSubmitting: false,
};

function useClientFormSubmission<
  TFields = Record<string, unknown[] | undefined>,
  TData = Record<string, unknown>,
  TSchema extends ZodSchema | undefined = undefined,
>({
  action,
  endpoint,
  enableUpload,
  onErrorRedirect,
  onSuccessRedirect,
  fileKey = 'file',
  uploadAction,
  uploadFileRoute,
  onError,
  onSuccess,
  schema,
  isFormDisabled = false,
}: ClientFormSubmissionProps<TFields, TData, TSchema>) {
  type Fields = SchemaFields<TSchema> & TFields;
  const [state, setState] = useState<Response<Fields, TData>>({});
  const [status, setStatus] = useState(INITIAL_STATUS);

  const isSubmittingRef = useRef(false);

  const resetStatus = useCallback(() => {
    setStatus(INITIAL_STATUS);
  }, []);

  // send errors through a single helper so onError + redirects stay consistent
  const errorCallback = useCallback(
    (type: ResponseType, message: string, redirect = true) => {
      onError?.({ type, message });
      if (redirect && onErrorRedirect) window.location.href = onErrorRedirect;
    },
    [onError, onErrorRedirect],
  );

  const uploadFileIfNeeded = useCallback(
    async (formData: FormData) => {
      if (!enableUpload) {
        return {
          fileUrl: null as string | null,
          fileName: null as string | null,
        };
      }

      if (!uploadAction && !uploadFileRoute) {
        console.warn('enableUpload is true but no upload handler provided.');
        return { fileUrl: null, fileName: null };
      }

      const value = formData.get(fileKey);

      if (!(value instanceof File)) {
        return { fileUrl: null, fileName: null };
      }

      const executeUpload = async () => {
        if (uploadAction) return uploadAction(formData);

        if (uploadFileRoute) {
          const response = await fetch(uploadFileRoute, {
            method: 'POST',
            body: formData,
          });

          const data = (await response.json()) as UploadResponse;
          return { ...data, ok: response.ok && data?.ok };
        }

        return null;
      };

      const uploadResponse = await executeUpload();

      if (!uploadResponse?.ok || !uploadResponse.url) {
        throw new Error(uploadResponse?.error || 'Failed to upload file.');
      }

      return {
        fileUrl: uploadResponse.url,
        fileName: uploadResponse.name ?? value.name,
      };
    },
    [enableUpload, fileKey, uploadAction, uploadFileRoute],
  );

  /**
   * Core submission pipeline used by both handleFormSubmit and handleFormAction.
   * Keeps validation, upload, endpoint/action and status handling in one place.
   */
  const runSubmission = useCallback(
    async (formData: FormData, opts?: { resetForm?: () => void }) => {
      if (isFormDisabled) return;

      // guard against users double-clicking submit
      if (isSubmittingRef.current) {
        errorCallback(
          RESPONSE.ALREADY_SUBMITTING.type,
          RESPONSE.ALREADY_SUBMITTING.message,
          false,
        );
        return;
      }

      let submissionCompleted = false;

      isSubmittingRef.current = true;

      setStatus((prev) => ({
        ...prev,
        isLoading: true,
        isPending: true,
        isSubmitting: true,
      }));

      try {
        // validation (if schema provided)
        if (schema) {
          const data = Object.fromEntries(formData);
          const validation = schema.safeParse(data);

          if (!validation.success) {
            errorCallback(
              RESPONSE.VALIDATION_ERROR.type,
              RESPONSE.VALIDATION_ERROR.message,
            );

            const flattened = validation.error.flatten();

            setState({
              ...RESPONSE.VALIDATION_ERROR,
              fieldErrors: flattened.fieldErrors as Record<
                keyof Fields,
                string[]
              >,
              formErrors: flattened.formErrors,
            });

            resetStatus();
            return;
          }
        }

        // upload first so API receives a URL instead of a File
        const { fileUrl, fileName } = await uploadFileIfNeeded(formData);

        if (fileUrl && fileName) {
          formData.set(fileKey, fileUrl);
        }

        let result: Response<Fields, TData> | undefined;

        // Prefer custom action if provided; otherwise fall back to endpoint.
        if (action) {
          // Create render time
          const response = await action(formData);

          if (!response?.ok) {
            errorCallback(
              response.type ?? RESPONSE.UNKNOWN_ERROR.type,
              response.message ?? RESPONSE.UNKNOWN_ERROR.message,
            );
            setState({ ok: false, ...response } as Response<Fields, TData>);

            setStatus((prev) => ({
              ...prev,
              isError: true,
            }));

            return;
          }

          result = response as Response<Fields, TData>;
        } else if (endpoint) {
          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });

          const data = (await response.json()) as Response<Fields, TData>;

          if (!data?.ok) {
            errorCallback(
              data.type ?? RESPONSE.UNKNOWN_ERROR.type,
              data.message ?? RESPONSE.UNKNOWN_ERROR.message,
            );
            setState({ ok: false, ...data });

            setStatus((prev) => ({
              ...prev,
              isError: true,
            }));

            return;
          }

          result = data;
        } else {
          console.warn(
            'useClientFormSubmission: neither `action` nor `endpoint` provided.',
          );

          setStatus((prev) => ({
            ...prev,
            isError: true,
          }));

          return;
        }

        // If we reach here, we have a successful result
        setState({ ok: true, ...result });

        onSuccess?.(result as Response<TFields, TData>);

        if (onSuccessRedirect) {
          window.location.href = onSuccessRedirect;
        }

        submissionCompleted = true;

        // allow caller to reset the form if they want
        opts?.resetForm?.();
      } catch (err) {
        console.error('Form submission error:', err);

        errorCallback(
          RESPONSE.UNKNOWN_ERROR.type,
          RESPONSE.UNKNOWN_ERROR.message,
        );

        setState({
          ...RESPONSE.UNKNOWN_ERROR,
        });

        setStatus((prev) => ({
          ...prev,
          isError: true,
        }));
      }

      isSubmittingRef.current = false;

      if (submissionCompleted) {
        setStatus((prev) => ({
          ...prev,
          isError: false,
          isSuccess: true,
          isFinished: true,
          isPending: false,
          isLoading: false,
          isFetching: false,
          isSubmitting: false,
        }));

        return;
      }

      setStatus((prev) => ({
        ...prev,
        isSuccess: false,
        isFinished: true,
        isLoading: false,
        isPending: false,
        isFetching: false,
        isSubmitting: false,
      }));
    },
    [
      action,
      endpoint,
      errorCallback,
      fileKey,
      isFormDisabled,
      onSuccess,
      onSuccessRedirect,
      resetStatus,
      schema,
      uploadFileIfNeeded,
    ],
  );

  const handleFormSubmitNoFormData = useCallback(async () => {
    await runSubmission(new FormData(), { resetForm: () => {} });
  }, [runSubmission]);

  const handleFormSubmit = useCallback(
    async (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();

      const form = e?.currentTarget;

      if (!form) {
        errorCallback(
          RESPONSE.FORM_NOT_FOUND.type,
          RESPONSE.FORM_NOT_FOUND.message,
        );
        return;
      }

      const formData = new FormData(form);
      await runSubmission(formData, { resetForm: () => form?.reset() });
    },
    [errorCallback, runSubmission],
  );

  const handleFormAction = useCallback(
    async (formData: FormData) => {
      await runSubmission(formData);
    },
    [runSubmission],
  );

  return {
    state,
    status,
    setState,
    handleFormSubmit,
    handleFormAction,
    handleFormSubmitNoFormData,
  };
}

export default useClientFormSubmission;
