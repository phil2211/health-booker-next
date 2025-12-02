import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
    try {
        const db = await getDatabase()

        // Aggregate tags grouped by category
        const groupedTags = await db.collection('therapy_tags').aggregate([
            {
                $group: {
                    _id: "$category",
                    tags: {
                        $push: "$$ROOT"
                    }
                }
            },
            {
                $sort: { "_id.en": 1 }
            }
        ]).toArray()

        const formattedCategories = groupedTags.map(group => ({
            category: group._id,
            tags: group.tags.map((tag: any) => ({
                id: tag._id.toString(),
                name: tag.subcategory || tag.name // Fallback to name if subcategory is missing
            })).sort((a: any, b: any) => {
                const nameA = a?.name?.en || '';
                const nameB = b?.name?.en || '';
                return nameA.localeCompare(nameB);
            })
        }))

        return NextResponse.json({ categories: formattedCategories })
    } catch (error) {
        console.error('Error fetching tags:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tags', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
