import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EduGenius AI ErrorBoundary:', error, info);
  }

  private handleReset = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6 text-[#1E1B4B]">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold text-red-900">
              Something went wrong · অ্যাপটি লোড হতে সমস্যা হয়েছে
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-5 inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#4338CA] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3730A3]"
            >
              Reload EduGenius AI
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
