import { NextRequest, NextResponse } from 'next/server';
import { quote, QuoteError, type QuoteInput } from '@/lib/shipping/affrancaposta';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.product || !body.destination || !body.weightGrams || !body.format) {
      return NextResponse.json(
        {
          code: 'INVALID_INPUT',
          message: 'Missing required fields: product, destination, weightGrams, format',
          context: { receivedFields: Object.keys(body) }
        },
        { status: 400 }
      );
    }
    
    // Validate destination structure
    if (!body.destination.type || (body.destination.type === 'INTL' && !body.destination.countryIso2)) {
      return NextResponse.json(
        {
          code: 'INVALID_INPUT',
          message: 'Invalid destination format. Required: { type: "ITALY" } or { type: "INTL", countryIso2: string }',
          context: { destination: body.destination }
        },
        { status: 400 }
      );
    }
    
    // Validate weight
    if (typeof body.weightGrams !== 'number' || body.weightGrams <= 0) {
      return NextResponse.json(
        {
          code: 'INVALID_INPUT',
          message: 'weightGrams must be a positive number',
          context: { weightGrams: body.weightGrams }
        },
        { status: 400 }
      );
    }
    
    // Construct input object
    const input: QuoteInput = {
      product: body.product,
      destination: body.destination,
      weightGrams: body.weightGrams,
      format: body.format,
      homologation: body.homologation,
      options: body.options
    };
    
    // Get quote
    const result = quote(input);
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    if (error instanceof QuoteError) {
      // Handle known quote errors
      const statusMap: Record<string, number> = {
        'INVALID_INPUT': 400,
        'FORMAT_NOT_ALLOWED': 400,
        'WEIGHT_OUT_OF_RANGE': 400,
        'ZONE_NOT_FOUND': 400,
        'OPTION_NOT_SUPPORTED': 400,
        'TARIFF_NOT_FOUND': 404
      };
      
      const status = statusMap[error.code] || 500;
      
      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
          context: error.context
        },
        { status }
      );
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in shipping quote API:', error);
    
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing the quote',
        context: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      code: 'METHOD_NOT_ALLOWED',
      message: 'This endpoint only supports POST requests',
      context: { supportedMethods: ['POST'] }
    },
    { status: 405 }
  );
}

export async function PUT() {
  return GET();
}

export async function DELETE() {
  return GET();
}

export async function PATCH() {
  return GET();
}