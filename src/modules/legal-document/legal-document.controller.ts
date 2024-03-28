import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { LegalDocumentType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CreateLegalDocumentParagraphBodyDto } from './dto/create-legal-document-paragraph-body.dto';
import { FilterLegalDocumentParagraphsQueryDto } from './dto/filter-legal-document-paragraphs-query.dto';
import { LegalDocumentParagraphResponseDto } from './dto/legal-document-paragraph-response.dto';
import { LegalDocumentResponseDto } from './dto/legal-document-response.dto';
import { UpdateLegalDocumentParagraphBodyDto } from './dto/update-legal-document-paragraph-body.dto';
import { LegalDocumentParagraphService } from './legal-document-paragraph/legal-document-paragraph.service';
import { LegalDocumentService } from './legal-document.service';

@Controller('legal-document')
export class LegalDocumentController {
  constructor(
    private readonly legalDocumentService: LegalDocumentService,
    private readonly legalDocumentParagraphService: LegalDocumentParagraphService,
  ) {}

  @Get()
  async getAllLegalDocuments(): Promise<LegalDocumentResponseDto[]> {
    const legalDocument = await this.legalDocumentService.getAllLegalDocuments();

    return plainToInstance(LegalDocumentResponseDto, legalDocument);
  }

  @Get('privacy-policy')
  async getPrivacyPolicy(): Promise<LegalDocumentResponseDto> {
    const legalDocument = await this.legalDocumentService.getLegalDocumentByType(LegalDocumentType.PRIVACY_POLICY);

    return plainToInstance(LegalDocumentResponseDto, legalDocument);
  }

  @Get('terms-of-service')
  async getTermsOfService(): Promise<LegalDocumentResponseDto> {
    const legalDocument = await this.legalDocumentService.getLegalDocumentByType(LegalDocumentType.TERMS_OF_SERVICE);

    return plainToInstance(LegalDocumentResponseDto, legalDocument);
  }

  @Get('paragraphs/:id')
  async getDocumentParagraph(@Param('id', ParseIntPipe) id: number): Promise<LegalDocumentParagraphResponseDto> {
    const legalDocumentParagraph = await this.legalDocumentParagraphService.getLegalDocumentParagraphById(id);

    return plainToInstance(LegalDocumentParagraphResponseDto, legalDocumentParagraph);
  }

  @Patch('paragraphs/:id')
  async updateDocumentParagraph(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLegalDocumentParagraphBodyDto,
  ): Promise<LegalDocumentParagraphResponseDto> {
    const legalDocumentParagraph = await this.legalDocumentParagraphService.updateLegalDocumentParagraphById(id, body);

    return plainToInstance(LegalDocumentParagraphResponseDto, legalDocumentParagraph);
  }

  @Delete('paragraphs/:id')
  async deleteDocumentParagraph(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.legalDocumentParagraphService.deleteLegalDocumentParagraphById(id);
  }

  @Get(':legalDocumentId/paragraphs')
  async filterDocumentParagraphs(
    @Param('legalDocumentId', ParseIntPipe) legalDocumentId: number,
    @Query() query: FilterLegalDocumentParagraphsQueryDto,
  ): Promise<LegalDocumentParagraphResponseDto[]> {
    const legalDocumentParagraphs = await this.legalDocumentParagraphService.filterLegalDocumentParagraphs({
      ...query,
      legalDocumentId,
    });

    return plainToInstance(LegalDocumentParagraphResponseDto, legalDocumentParagraphs);
  }

  @Post(':legalDocumentId/paragraphs')
  async createLegalDocumentParagraph(
    @Param('legalDocumentId') legalDocumentId: number,
    @Body() body: CreateLegalDocumentParagraphBodyDto,
  ): Promise<LegalDocumentParagraphResponseDto> {
    const legalDocumentParagraph = await this.legalDocumentParagraphService.createLegalDocumentParagraph({
      ...body,
      legalDocumentId,
    });

    return plainToInstance(LegalDocumentParagraphResponseDto, legalDocumentParagraph);
  }
}
