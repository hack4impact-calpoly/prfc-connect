export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
