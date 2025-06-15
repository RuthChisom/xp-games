import { NextRequest, NextResponse } from 'next/server';
import { avalancheFuji } from 'viem/chains';
import { createMetadata, ValidatedMetadata, ExecutionResponse, Metadata } from '@sherrylinks/sdk';
import { serialize } from 'wagmi';
import { encodeFunctionData, TransactionSerializable } from 'viem';

import { abi } from '@/blockchain/abi';

const CONTRACT_ADDRESS = '0x81AeC0B87CAa631365B0AC0B628A84afdf6f1Fe9';

export async function GET(req: NextRequest) {
  try {
    // Get server base URL
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const serverUrl = `${protocol}://${host}`;

    const metadata: Metadata = {
      url: "https://sherry.social",
      icon: "https://drive.google.com/uc?export=view&id=1S-S6BzeV52cMsWuR6JAOTkKxHRlYuM9K",
      title: "Add XP to Player",
      baseUrl: serverUrl,
      description: "Give XP to a player and auto-level them up on-chain",

      actions: [
        {
          type: 'dynamic',
          label: 'Add XP',
          description: 'Award XP to a player and mint badge on level up',
          chains: {
            source: 'fuji',
          },
          path: `/api/my-app`,

          params: [
            {
              name: 'player',
              label: 'Player Address',
              type: 'text',
              required: true,
              description: 'Wallet address of the player',
            },
            {
              name: 'xp',
              label: 'XP Amount',
              type: 'number',
              required: true,
              description: 'Amount of XP to award',
            },
          ],
        },
      ],
    };

    const validated: ValidatedMetadata = createMetadata(metadata);

    return NextResponse.json(validated, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  } catch (error) {
    console.error('Metadata Error:', error);
    return NextResponse.json({ error: 'Failed to create metadata' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const player = searchParams.get('player');
    const xp = searchParams.get('xp');

    if (!player || !xp) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    const data = encodeFunctionData({
      abi: abi,
      functionName: 'addXP',
      args: [player as `0x${string}`, BigInt(xp)],
    });

    const tx: TransactionSerializable = {
      to: CONTRACT_ADDRESS,
      data: data,
      chainId: avalancheFuji.id,
      type: 'legacy',
    };

    const serialized = serialize(tx);

    const resp: ExecutionResponse = {
      serializedTransaction: serialized,
      chainId: avalancheFuji.name,
    };

    return NextResponse.json(resp, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept',
    },
  });
}
